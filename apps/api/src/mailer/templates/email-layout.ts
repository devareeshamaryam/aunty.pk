/**
 * Shared email layout wrapper used by all order email templates.
 * Provides consistent header, footer, and styling.
 */

export function emailLayout(storeName: string, bodyContent: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${storeName}</title>
  <style>
    /* Reset */
    body, table, td, div, p { margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; color: #1a1a2e; -webkit-font-smoothing: antialiased; }
    img { border: 0; max-width: 100%; }

    .email-wrapper { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .email-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 40px; text-align: center; }
    .email-header h1 { color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; margin: 0; }
    .email-header p { color: rgba(255,255,255,0.85); font-size: 14px; margin-top: 6px; }
    .email-body { padding: 40px; }
    .email-footer { background: #f8f9fa; padding: 24px 40px; text-align: center; border-top: 1px solid #e9ecef; }
    .email-footer p { color: #868e96; font-size: 12px; line-height: 1.6; }

    .greeting { font-size: 18px; color: #1a1a2e; margin-bottom: 8px; font-weight: 600; }
    .subtitle { font-size: 14px; color: #495057; line-height: 1.6; margin-bottom: 24px; }

    .status-badge { display: inline-block; padding: 8px 20px; border-radius: 50px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
    .status-pending { background: #fff3cd; color: #856404; }
    .status-processing { background: #cce5ff; color: #004085; }
    .status-shipped { background: #d4edda; color: #155724; }
    .status-delivered { background: #d1ecf1; color: #0c5460; }
    .status-cancelled { background: #f8d7da; color: #721c24; }

    .section-title { font-size: 14px; font-weight: 700; color: #495057; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e9ecef; }

    .order-item { display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f3f5; }
    .order-item:last-child { border-bottom: none; }
    .item-details { flex: 1; }
    .item-name { font-size: 15px; font-weight: 600; color: #1a1a2e; }
    .item-variant { font-size: 12px; color: #868e96; margin-top: 2px; }
    .item-qty { font-size: 13px; color: #495057; }
    .item-price { font-size: 15px; font-weight: 700; color: #1a1a2e; text-align: right; min-width: 80px; }

    .total-row { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; margin-top: 8px; border-top: 2px solid #1a1a2e; }
    .total-label { font-size: 16px; font-weight: 700; color: #1a1a2e; }
    .total-amount { font-size: 20px; font-weight: 800; color: #667eea; }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px; }
    .info-card { background: #f8f9fa; border-radius: 12px; padding: 20px; }
    .info-card-title { font-size: 12px; font-weight: 700; color: #868e96; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .info-card-text { font-size: 14px; color: #1a1a2e; line-height: 1.6; }

    .emoji-icon { font-size: 40px; text-align: center; margin-bottom: 8px; }

    /* For email clients that don't support flexbox/grid, use table fallbacks */
    @media only screen and (max-width: 600px) {
      .email-body { padding: 24px 20px; }
      .email-header { padding: 24px 20px; }
      .info-grid { display: block; }
      .info-card { margin-bottom: 12px; }
    }
  </style>
</head>
<body style="margin:0; padding:20px 0; background-color:#f0f2f5;">
  <div class="email-wrapper">
    <div class="email-header">
      <h1>${storeName}</h1>
    </div>
    <div class="email-body">
      ${bodyContent}
    </div>
    <div class="email-footer">
      <p>© ${new Date().getFullYear()} ${storeName}. All rights reserved.<br/>
      This is an automated email. Please do not reply directly.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Render order items table (used in all templates).
 */
export function renderOrderItems(
  items: Array<{ name: string; price: number; quantity: number; variantName?: string }>,
  totalAmount: number,
): string {
  const rows = items
    .map(
      (item) => `
    <div class="order-item">
      <div class="item-details">
        <div class="item-name">${item.name}</div>
        ${item.variantName ? `<div class="item-variant">${item.variantName}</div>` : ''}
        <div class="item-qty">Qty: ${item.quantity}</div>
      </div>
      <div class="item-price">Rs. ${(item.price * item.quantity).toLocaleString()}</div>
    </div>
  `,
    )
    .join('');

  return `
    <div style="margin-bottom:24px;">
      <div class="section-title">Order Items</div>
      ${rows}
      <div class="total-row">
        <div class="total-label">Total</div>
        <div class="total-amount">Rs. ${totalAmount.toLocaleString()}</div>
      </div>
    </div>
  `;
}

/**
 * Render shipping & payment info cards.
 */
export function renderInfoCards(
  shippingAddress: { street: string; city: string; state: string; zipCode: string; phone: string },
  paymentMethod: string,
  orderId: string,
): string {
  return `
    <div class="info-grid">
      <div class="info-card">
        <div class="info-card-title">📦 Shipping Address</div>
        <div class="info-card-text">
          ${shippingAddress.street}<br/>
          ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}<br/>
          📞 ${shippingAddress.phone}
        </div>
      </div>
      <div class="info-card">
        <div class="info-card-title">💳 Payment</div>
        <div class="info-card-text">
          ${paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment (Stripe)'}<br/><br/>
          <strong>Order ID:</strong><br/>
          #${orderId.slice(-8).toUpperCase()}
        </div>
      </div>
    </div>
  `;
}
