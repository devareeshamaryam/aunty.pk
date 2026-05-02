 import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IOrder, IProduct } from '@repo/db';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { MailService, OrderMailData } from '../mailer/mail.service';
// ✅ NAYA: File system imports
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel('Order') private orderModel: Model<IOrder>,
    @InjectModel('Product') private productModel: Model<IProduct>,
    private mailService: MailService,
  ) {}

  /**
   * Helper to build mail data from an order document.
   */
  private buildMailData(order: any): OrderMailData {
    return {
      orderId: order._id.toString(),
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      items: order.items.map((item: any) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        variantName: item.variantName,
      })),
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
    };
  }

  // ✅ NAYA: Voice message save karne ka helper method
  private saveVoiceMessage(
    voiceData: { data: string; mimeType: string; durationSeconds: number },
    orderId: string,
  ): { fileUrl: string; mimeType: string; durationSeconds: number; uploadedAt: Date } {
    // uploads/voice-orders/ folder — ye folder automatically ban jayega
    const uploadDir = path.join(process.cwd(), 'uploads', 'voice-orders');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `voice-${orderId}-${Date.now()}.webm`;
    const filePath = path.join(uploadDir, fileName);

    // base64 decode karke file disk pe save karein
    const buffer = Buffer.from(voiceData.data, 'base64');
    fs.writeFileSync(filePath, buffer);

    return {
      fileUrl: `/uploads/voice-orders/${fileName}`,
      mimeType: voiceData.mimeType,
      durationSeconds: voiceData.durationSeconds,
      uploadedAt: new Date(),
    };
  }

  async create(userId: string | undefined, dto: CreateOrderDto) {
    let totalAmount = 0;

    // Validate products and stock
    for (const item of dto.items) {
      // ✅ Try to find as Product first, if not found, check if it's a TopUp item
      const product = await this.productModel.findById(item.product);
      
      // If it's not a product, it might be a topup item (add-on)
      // TopUp items don't need stock validation
      if (!product) {
        // Check if it's a valid TopUp item by checking if variantName is 'Add-on'
        if (item.variantName === 'Add-on') {
          // This is a topup item, just add to total and continue
          totalAmount += item.price * item.quantity;
          continue;
        }
        // If not a topup item and not a product, throw error
        throw new NotFoundException(`Product ${item.name} not found`);
      }

      // Regular product stock validation
      if (item.variantName && item.variantName !== 'Add-on') {
        const variant = product.variants?.find(v => v.name === item.variantName);
        if (!variant) {
          throw new BadRequestException(`Variant ${item.variantName} not found for ${item.name}`);
        }
        if (variant.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for ${item.name} (${item.variantName})`);
        }
        variant.stock -= item.quantity;
      } else {
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for ${item.name}`);
        }
        product.stock -= item.quantity;
      }

      totalAmount += item.price * item.quantity;
      await product.save();
    }

    const order = new this.orderModel({
      // Only attach user if logged in — guest orders have no user
      ...(userId ? { user: userId } : {}),
      ...dto,
      totalAmount,
      // ✅ NAYA: voiceMessage ko spread hone se rokein (handle separately)
      voiceMessage: undefined,
    });

    // ✅ NAYA: Voice message save karna — agar user ne record kiya ho
    if (dto.voiceMessage) {
      const savedVoice = this.saveVoiceMessage(dto.voiceMessage, order._id.toString());
      order.set('voiceMessage', savedVoice);
    }

    const savedOrder = await order.save();

    // Send order confirmation email
    const mailData = this.buildMailData(savedOrder);
    this.mailService.sendOrderConfirmation(mailData).catch(() => {});

    return { order: savedOrder };
  }

  async findAll(query: { page?: number; limit?: number; status?: string; user?: string }) {
    const { page = 1, limit = 10, status, user } = query;
    const filter: any = {};

    if (status) filter.status = status;
    if (user) filter.user = user;

    const [orders, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.orderModel.countDocuments(filter),
    ]);

    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const order = await this.orderModel
      .findById(id)
      .populate('user', 'name email')
      .lean();
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findUserOrders(userId: string, email?: string) {
    const filter: any = {
      $or: [{ user: userId }],
    };

    if (email) {
      filter.$or.push({ customerEmail: email });
    }

    return this.orderModel
      .find(filter)
      .sort({ createdAt: -1 })
      .lean();
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('Order not found');

    order.status = dto.status;
    const updatedOrder = await order.save();

    // Send status update email
    const mailData = this.buildMailData(updatedOrder);
    this.mailService.sendOrderStatusEmail(dto.status, mailData).catch(() => {});

    return updatedOrder;
  }

  async getStats() {
    const totalOrders = await this.orderModel.countDocuments();
    const pendingOrders = await this.orderModel.countDocuments({ status: 'PENDING' });
    const deliveredOrders = await this.orderModel.countDocuments({ status: 'DELIVERED' });

    const revenue = await this.orderModel.aggregate([
      { $match: { status: { $ne: 'CANCELLED' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    const recentOrders = await this.orderModel
      .find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return {
      total: totalOrders,
      pending: pendingOrders,
      delivered: deliveredOrders,
      revenue: revenue[0]?.total || 0,
      recentOrders,
    };
  }
}