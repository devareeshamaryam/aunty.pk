import { OrderMailData } from '../mail.service';
import { emailLayout, renderOrderItems, renderInfoCards } from './email-layout';

export function getOrderCancelledHtml(data: OrderMailData, storeName: string): string {
  const body = `
    <div class="emoji-icon">😔</div>
    <p class="greeting">Hi ${data.customerName},</p>
    <p class="subtitle">
      We're sorry to inform you that your order has been cancelled. If you didn't request this cancellation, please contact our support team immediately.
    </p>

    <div style="text-align:center; margin-bottom:24px;">
      <span class="status-badge status-cancelled">Cancelled</span>
    </div>

    ${renderOrderItems(data.items, data.totalAmount)}
    ${renderInfoCards(data.shippingAddress, data.paymentMethod, data.orderId)}

    <div style="margin-top:32px; padding:24px; background:#fff3cd; border-radius:12px; text-align:center;">
      <p style="font-size:14px; color:#856404; margin:0;">
        <strong>💡 Need help?</strong><br/>
        If you have any questions about this cancellation, please contact our support team.
        ${data.paymentMethod !== 'COD' ? '<br/><br/>If you made an online payment, your refund will be processed within 5-7 business days.' : ''}
      </p>
    </div>
  `;

  return emailLayout(storeName, body);
}
