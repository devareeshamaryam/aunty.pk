import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { getOrderConfirmationHtml } from './templates/order-confirmation';
import { getOrderProcessingHtml } from './templates/order-processing';
import { getOrderShippedHtml } from './templates/order-shipped';
import { getOrderDeliveredHtml } from './templates/order-delivered';
import { getOrderCancelledHtml } from './templates/order-cancelled';

export interface OrderMailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    image?: string;
    variantName?: string;
  }>;
  totalAmount: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
  };
  paymentMethod: string;
}

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);
  private readonly fromEmail: string;
  private readonly storeName: string;

  constructor(private configService: ConfigService) {
    this.fromEmail = this.configService.get<string>('MAIL_FROM', 'noreply@myecom.com');
    this.storeName = this.configService.get<string>('STORE_NAME', 'My E-Commerce Store');

    const mailHost = this.configService.get<string>('MAIL_HOST', 'smtp.example.com');
    const mailPort = this.configService.get<number>('MAIL_PORT', 587);
    const mailSecure = this.configService.get<string>('MAIL_SECURE', 'false') === 'true';
    const mailUser = this.configService.get<string>('MAIL_USER', '');

    this.transporter = nodemailer.createTransport({
      host: mailHost,
      port: mailPort,
      secure: mailSecure,
      auth: {
        user: mailUser,
        pass: this.configService.get<string>('MAIL_PASS', ''),
      },
    });

    // Debug: Log the loaded config on startup
    this.logger.log(`Mail configured → host=${mailHost}, port=${mailPort}, secure=${mailSecure}, user=${mailUser}, from=${this.fromEmail}, store=${this.storeName}`);
  }

  // ─── ORDER CONFIRMATION (new order placed) ───────────────────────
  async sendOrderConfirmation(data: OrderMailData): Promise<void> {
    try {
      const html = getOrderConfirmationHtml(data, this.storeName);
      await this.transporter.sendMail({
        from: `"${this.storeName}" <${this.fromEmail}>`,
        to: data.customerEmail,
        subject: `Order Confirmed! #${data.orderId.slice(-8).toUpperCase()}`,
        html,
      });
      this.logger.log(`Order confirmation email sent to ${data.customerEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send order confirmation email: ${error.message}`);
    }
  }

  // ─── ORDER PROCESSING ────────────────────────────────────────────
  async sendOrderProcessing(data: OrderMailData): Promise<void> {
    try {
      const html = getOrderProcessingHtml(data, this.storeName);
      await this.transporter.sendMail({
        from: `"${this.storeName}" <${this.fromEmail}>`,
        to: data.customerEmail,
        subject: `Your Order #${data.orderId.slice(-8).toUpperCase()} is Being Processed`,
        html,
      });
      this.logger.log(`Order processing email sent to ${data.customerEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send order processing email: ${error.message}`);
    }
  }

  // ─── ORDER SHIPPED ───────────────────────────────────────────────
  async sendOrderShipped(data: OrderMailData): Promise<void> {
    try {
      const html = getOrderShippedHtml(data, this.storeName);
      await this.transporter.sendMail({
        from: `"${this.storeName}" <${this.fromEmail}>`,
        to: data.customerEmail,
        subject: `Your Order #${data.orderId.slice(-8).toUpperCase()} Has Been Shipped! 🚚`,
        html,
      });
      this.logger.log(`Order shipped email sent to ${data.customerEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send order shipped email: ${error.message}`);
    }
  }

  // ─── ORDER DELIVERED ─────────────────────────────────────────────
  async sendOrderDelivered(data: OrderMailData): Promise<void> {
    try {
      const html = getOrderDeliveredHtml(data, this.storeName);
      await this.transporter.sendMail({
        from: `"${this.storeName}" <${this.fromEmail}>`,
        to: data.customerEmail,
        subject: `Your Order #${data.orderId.slice(-8).toUpperCase()} Has Been Delivered! 🎉`,
        html,
      });
      this.logger.log(`Order delivered email sent to ${data.customerEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send order delivered email: ${error.message}`);
    }
  }

  // ─── ORDER CANCELLED ────────────────────────────────────────────
  async sendOrderCancelled(data: OrderMailData): Promise<void> {
    try {
      const html = getOrderCancelledHtml(data, this.storeName);
      await this.transporter.sendMail({
        from: `"${this.storeName}" <${this.fromEmail}>`,
        to: data.customerEmail,
        subject: `Order #${data.orderId.slice(-8).toUpperCase()} Has Been Cancelled`,
        html,
      });
      this.logger.log(`Order cancelled email sent to ${data.customerEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send order cancelled email: ${error.message}`);
    }
  }

  // ─── DISPATCH BY STATUS ──────────────────────────────────────────
  async sendOrderStatusEmail(status: string, data: OrderMailData): Promise<void> {
    switch (status) {
      case 'PENDING':
        await this.sendOrderConfirmation(data);
        break;
      case 'PROCESSING':
        await this.sendOrderProcessing(data);
        break;
      case 'SHIPPED':
        await this.sendOrderShipped(data);
        break;
      case 'DELIVERED':
        await this.sendOrderDelivered(data);
        break;
      case 'CANCELLED':
        await this.sendOrderCancelled(data);
        break;
      default:
        this.logger.warn(`Unknown order status: ${status}`);
    }
  }
}
