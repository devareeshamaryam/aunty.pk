/**
 * WhatsApp link helper — desktop pe `whatsapp://` protocol prompt avoid karta hai.
 *
 * - Mobile: `https://wa.me/<number>?text=...` (WhatsApp app me deeplink kholta)
 * - Desktop: `https://web.whatsapp.com/send?phone=<number>&text=...` (browser tab — no prompt)
 *
 * Number international format me, leading "+" ke bina (e.g. "923105717097").
 */
export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const encoded = encodeURIComponent(message);
  const number = phoneNumber.replace(/\D/g, '');

  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  return isMobile
    ? `https://wa.me/${number}?text=${encoded}`
    : `https://web.whatsapp.com/send?phone=${number}&text=${encoded}`;
}

/** Shortcut: build URL aur naya tab kholo. */
export function openWhatsApp(phoneNumber: string, message: string): void {
  const url = buildWhatsAppUrl(phoneNumber, message);
  window.open(url, '_blank', 'noopener,noreferrer');
}
