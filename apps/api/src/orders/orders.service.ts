import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IOrder, IProduct, OrderStatus } from '@repo/db';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateOrderEtaDto } from './dto/order.dto';
import { MailService, OrderMailData } from '../mailer/mail.service';
import { SettingsService } from '../settings/settings.service';
import { isMultanCity, isWithinMultan } from '../common/geo';
import * as fs from 'fs';
import * as path from 'path';

// New 3-stage flow: Preparing → On the way → Delivered (CANCELLED is always an
// option). Legacy PLACED/CONFIRMED orders are still transition-able into
// PREPARING so historical data can be moved forward by admin.
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ['PREPARING', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['RIDER_ON_WAY', 'CANCELLED'],
  RIDER_ON_WAY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel('Order') private orderModel: Model<IOrder>,
    @InjectModel('Product') private productModel: Model<IProduct>,
    private mailService: MailService,
    private settingsService: SettingsService,
  ) {}

  private buildMailData(order: any): OrderMailData {
    return {
      orderId: order._id.toString(),
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      items: order.items.map((i: any) => ({
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image,
        variantName: i.variantName,
      })),
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
    };
  }

  private static readonly VOICE_MIME_TO_EXT: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/wav': 'wav',
  };

  private async saveVoiceMessage(
    voiceData: { data: string; mimeType: string; durationSeconds: number },
    orderId: string,
  ) {
    const ext = OrdersService.VOICE_MIME_TO_EXT[voiceData.mimeType];
    if (!ext) throw new BadRequestException(`Unsupported voice mime: ${voiceData.mimeType}`);

    const buffer = Buffer.from(voiceData.data, 'base64');
    const maxBytes = Number(process.env.MAX_VOICE_SIZE_MB || 10) * 1024 * 1024;
    if (buffer.length === 0 || buffer.length > maxBytes) {
      throw new BadRequestException(`Voice size out of range (max ${maxBytes} bytes)`);
    }

    const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads', 'voice-orders');
    await fs.promises.mkdir(uploadDir, { recursive: true });

    const safeId = path.basename(String(orderId)).replace(/[^a-zA-Z0-9]/g, '');
    const fileName = `voice-${safeId}-${Date.now()}.${ext}`;
    await fs.promises.writeFile(path.join(uploadDir, fileName), buffer);

    return {
      fileUrl: `/uploads/voice-orders/${fileName}`,
      mimeType: voiceData.mimeType,
      durationSeconds: voiceData.durationSeconds,
      uploadedAt: new Date(),
    };
  }

  async create(userId: string | undefined, dto: CreateOrderDto) {
    // === 1. Address / location ===
    // New flow: the customer always types a street address at checkout.
    // The browser's geolocation (deliveryLocation) is captured silently in
    // the background and attached automatically when available — so admins
    // can see the exact pin on the map for delivery, while customers only
    // ever see/fill the simple street field.
    if (!dto.shippingAddress?.street && !dto.deliveryLocation) {
      throw new BadRequestException('A delivery address is required.');
    }

    if (dto.deliveryLocation) {
      // If the silent pin is way outside Multan we ignore it rather than
      // failing the order — the typed street is the source of truth.
      if (!isWithinMultan(dto.deliveryLocation)) {
        dto.deliveryLocation = undefined;
      }
    }

    if (dto.shippingAddress) {
      // City is enforced to Multan; we no longer ask the customer for it.
      if (!dto.shippingAddress.city) {
        dto.shippingAddress.city = 'Multan';
      }
      if (!isMultanCity(dto.shippingAddress.city)) {
        throw new BadRequestException(
          'Sorry, we currently deliver only in Multan.',
        );
      }
    }

    // === 2. Compute items total + validate stock + backfill slug ===
    let itemsTotal = 0;
    for (const item of dto.items) {
      const product = await this.productModel.findById(item.product);
      if (!product) {
        throw new NotFoundException(`Product not found: ${item.name}`);
      }
      // Denormalize slug so the tracking page can deep-link to the product
      (item as any).slug = product.slug;

      if (item.variantName) {
        const variant = product.variants?.find((v) => v.name === item.variantName);
        if (!variant) {
          throw new BadRequestException(`Variant "${item.variantName}" not found for ${item.name}`);
        }
        if (variant.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock: ${item.name} (${item.variantName})`);
        }
        variant.stock -= item.quantity;
      } else {
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock: ${item.name}`);
        }
        product.stock -= item.quantity;
      }

      itemsTotal += item.price * item.quantity;
      await product.save();
    }

    // === 3. Compute delivery fee from admin settings ===
    const deliveryFee = await this.settingsService.computeDeliveryFee(itemsTotal);
    const totalAmount = itemsTotal + deliveryFee;

    // === 4. Build + save order ===
    const now = new Date();
    const order = new this.orderModel({
      ...(userId ? { user: userId } : {}),
      guestId: dto.guestId,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      customerPhone: dto.customerPhone,
      items: dto.items,
      itemsTotal,
      deliveryFee,
      totalAmount,
      deliveryLocation: dto.deliveryLocation,
      shippingAddress: dto.shippingAddress,
      status: 'PREPARING',
      statusHistory: [{ status: 'PREPARING', at: now }],
      paymentMethod: 'COD',
    });

    if (dto.voiceMessage) {
      const savedVoice = await this.saveVoiceMessage(dto.voiceMessage, order._id.toString());
      order.set('voiceMessage', savedVoice);
    }

    const savedOrder = await order.save();

    if (savedOrder.customerEmail) {
      const mailData = this.buildMailData(savedOrder);
      this.mailService.sendOrderConfirmation(mailData).catch(() => {});
    }

    return { order: savedOrder };
  }

  async findAll(query: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 10, status } = query;
    const filter: any = {};
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.orderModel.countDocuments(filter),
    ]);

    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const order = await this.orderModel.findById(id).lean();
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  /**
   * Public-facing tracking: caller must supply the guestId that owns the order.
   * Returns a redacted view safe to expose to the customer.
   */
  async trackForGuest(id: string, guestId: string) {
    const order = await this.orderModel.findById(id).lean();
    if (!order) throw new NotFoundException('Order not found');
    if (!order.guestId || order.guestId !== guestId) {
      throw new ForbiddenException('You do not have access to this order');
    }
    return {
      _id: order._id,
      status: order.status,
      statusHistory: order.statusHistory,
      estimatedDeliveryAt: order.estimatedDeliveryAt,
      estimatedDeliveryText: order.estimatedDeliveryText,
      riderNote: order.riderNote,
      items: order.items,
      itemsTotal: order.itemsTotal,
      deliveryFee: order.deliveryFee,
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress,
      deliveryLocation: order.deliveryLocation,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      createdAt: order.createdAt,
    };
  }

  async listForGuest(guestId: string) {
    return this.orderModel
      .find({ guestId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('Order not found');

    const current = order.status as OrderStatus;
    const allowed = TRANSITIONS[current] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`Cannot transition from ${current} to ${dto.status}`);
    }

    order.status = dto.status;
    order.statusHistory.push({ status: dto.status, note: dto.note, at: new Date() });
    const updated = await order.save();

    if (updated.customerEmail) {
      const mailData = this.buildMailData(updated);
      this.mailService.sendOrderStatusEmail(dto.status, mailData).catch(() => {});
    }

    return updated;
  }

  async updateEta(id: string, dto: UpdateOrderEtaDto) {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('Order not found');

    if (dto.estimatedDeliveryAt !== undefined) {
      order.estimatedDeliveryAt = dto.estimatedDeliveryAt ? new Date(dto.estimatedDeliveryAt) : undefined;
    }
    if (dto.estimatedDeliveryText !== undefined) {
      order.estimatedDeliveryText = dto.estimatedDeliveryText;
    }
    if (dto.riderNote !== undefined) {
      order.riderNote = dto.riderNote;
    }

    return order.save();
  }

  /** Recent unseen orders for the admin dashboard "new orders" banner. */
  async listUnseen(limit = 10) {
    return this.orderModel
      .find({ seenByAdmin: false, status: { $ne: 'CANCELLED' } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async unseenCount() {
    return this.orderModel.countDocuments({
      seenByAdmin: false,
      status: { $ne: 'CANCELLED' },
    });
  }

  /** Mark an order as seen by the admin. Idempotent. */
  async markSeen(id: string) {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    if (!order.seenByAdmin) {
      order.seenByAdmin = true;
      order.seenAt = new Date();
      await order.save();
    }
    return { ok: true, seenAt: order.seenAt };
  }

  async getStats() {
    const [total, placed, preparing, riderOnWay, delivered, revenueAgg] = await Promise.all([
      this.orderModel.countDocuments(),
      this.orderModel.countDocuments({ status: 'PLACED' }),
      this.orderModel.countDocuments({ status: 'PREPARING' }),
      this.orderModel.countDocuments({ status: 'RIDER_ON_WAY' }),
      this.orderModel.countDocuments({ status: 'DELIVERED' }),
      this.orderModel.aggregate([
        { $match: { status: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const recentOrders = await this.orderModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return {
      total,
      placed,
      preparing,
      riderOnWay,
      delivered,
      revenue: revenueAgg[0]?.total || 0,
      recentOrders,
    };
  }
}
