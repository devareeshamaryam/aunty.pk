import { OrderMailData } from '../mail.service';
import { emailLayout, renderOrderItems, renderInfoCards } from './email-layout';

export function getOrderDeliveredHtml(data: OrderMailData, storeName: string): string {
  const body = `
    <div class="emoji-icon">🎊</div>
    <p class="greeting">Hi ${data.customerName},</p>
    <p class="subtitle">
      Your order has been delivered! We hope you love your purchase. If you have any questions or concerns, don't hesitate to reach out.
    </p>

    <div style="text-align:center; margin-bottom:24px;">
      <span class="status-badge status-delivered">Delivered</span>
    </div>

    <!-- Progress tracker — all steps complete -->
    <div style="margin-bottom:32px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td style="width:25%; text-align:center;">
            <div style="width:32px; height:32px; border-radius:50%; background:#28a745; color:#fff; font-size:14px; font-weight:700; line-height:32px; margin:0 auto;">✓</div>
            <p style="font-size:11px; color:#28a745; font-weight:600; margin-top:6px;">Placed</p>
          </td>
          <td style="width:25%; text-align:center;">
            <div style="width:32px; height:32px; border-radius:50%; background:#28a745; color:#fff; font-size:14px; font-weight:700; line-height:32px; margin:0 auto;">✓</div>
            <p style="font-size:11px; color:#28a745; font-weight:600; margin-top:6px;">Processed</p>
          </td>
          <td style="width:25%; text-align:center;">
            <div style="width:32px; height:32px; border-radius:50%; background:#28a745; color:#fff; font-size:14px; font-weight:700; line-height:32px; margin:0 auto;">✓</div>
            <p style="font-size:11px; color:#28a745; font-weight:600; margin-top:6px;">Shipped</p>
          </td>
          <td style="width:25%; text-align:center;">
            <div style="width:32px; height:32px; border-radius:50%; background:#28a745; color:#fff; font-size:14px; font-weight:700; line-height:32px; margin:0 auto;">✓</div>
            <p style="font-size:11px; color:#28a745; font-weight:600; margin-top:6px;">Delivered</p>
          </td>
        </tr>
      </table>
    </div>

    ${renderOrderItems(data.items, data.totalAmount)}
    ${renderInfoCards(data.shippingAddress, data.paymentMethod, data.orderId)}

    <div style="margin-top:32px; padding:24px; background:linear-gradient(135deg, #667eea15, #764ba215); border-radius:12px; text-align:center;">
      <p style="font-size:16px; font-weight:700; color:#1a1a2e; margin:0 0 8px 0;">
        ⭐ Enjoying your purchase?
      </p>
      <p style="font-size:14px; color:#495057; margin:0;">
        We'd love to hear your feedback! Leave a review to help other shoppers.
      </p>
    </div>
  `;

  return emailLayout(storeName, body);
}
