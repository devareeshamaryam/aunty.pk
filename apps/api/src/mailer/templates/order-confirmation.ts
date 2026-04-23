import { OrderMailData } from '../mail.service';
import { emailLayout, renderOrderItems, renderInfoCards } from './email-layout';

export function getOrderConfirmationHtml(data: OrderMailData, storeName: string): string {
  const body = `
    <div class="emoji-icon">🎉</div>
    <p class="greeting">Thank you, ${data.customerName}!</p>
    <p class="subtitle">
      Your order has been placed successfully. We've received your order and will begin processing it shortly.
    </p>

    <div style="text-align:center; margin-bottom:24px;">
      <span class="status-badge status-pending">Order Confirmed</span>
    </div>

    ${renderOrderItems(data.items, data.totalAmount)}
    ${renderInfoCards(data.shippingAddress, data.paymentMethod, data.orderId)}

    <div style="margin-top:32px; padding:20px; background:linear-gradient(135deg, #667eea15, #764ba215); border-radius:12px; text-align:center;">
      <p style="font-size:14px; color:#495057; margin:0;">
        <strong>What's next?</strong><br/>
        We'll send you another email once your order starts being processed.
      </p>
    </div>
  `;

  return emailLayout(storeName, body);
}
