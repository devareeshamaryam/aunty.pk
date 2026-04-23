import { OrderMailData } from '../mail.service';
import { emailLayout, renderOrderItems, renderInfoCards } from './email-layout';

export function getOrderProcessingHtml(data: OrderMailData, storeName: string): string {
  const body = `
    <div class="emoji-icon">⚙️</div>
    <p class="greeting">Hi ${data.customerName},</p>
    <p class="subtitle">
      Great news! Your order is now being processed. Our team is preparing your items for shipment.
    </p>

    <div style="text-align:center; margin-bottom:24px;">
      <span class="status-badge status-processing">Processing</span>
    </div>

    <!-- Progress tracker -->
    <div style="margin-bottom:32px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td style="width:25%; text-align:center;">
            <div style="width:32px; height:32px; border-radius:50%; background:#667eea; color:#fff; font-size:14px; font-weight:700; line-height:32px; margin:0 auto;">✓</div>
            <p style="font-size:11px; color:#667eea; font-weight:600; margin-top:6px;">Placed</p>
          </td>
          <td style="width:25%; text-align:center;">
            <div style="width:32px; height:32px; border-radius:50%; background:#667eea; color:#fff; font-size:14px; font-weight:700; line-height:32px; margin:0 auto;">2</div>
            <p style="font-size:11px; color:#667eea; font-weight:600; margin-top:6px;">Processing</p>
          </td>
          <td style="width:25%; text-align:center;">
            <div style="width:32px; height:32px; border-radius:50%; background:#dee2e6; color:#868e96; font-size:14px; font-weight:700; line-height:32px; margin:0 auto;">3</div>
            <p style="font-size:11px; color:#868e96; margin-top:6px;">Shipped</p>
          </td>
          <td style="width:25%; text-align:center;">
            <div style="width:32px; height:32px; border-radius:50%; background:#dee2e6; color:#868e96; font-size:14px; font-weight:700; line-height:32px; margin:0 auto;">4</div>
            <p style="font-size:11px; color:#868e96; margin-top:6px;">Delivered</p>
          </td>
        </tr>
      </table>
    </div>

    ${renderOrderItems(data.items, data.totalAmount)}
    ${renderInfoCards(data.shippingAddress, data.paymentMethod, data.orderId)}

    <div style="margin-top:32px; padding:20px; background:linear-gradient(135deg, #cce5ff50, #e2d5f850); border-radius:12px; text-align:center;">
      <p style="font-size:14px; color:#495057; margin:0;">
        <strong>What's next?</strong><br/>
        You'll receive a shipping notification once your package is on its way.
      </p>
    </div>
  `;

  return emailLayout(storeName, body);
}
