 'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Plus, Minus, Trash2, ShoppingBag, ArrowLeft, MessageCircle } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { getImageUrl } from '../lib/api'
import Link from 'next/link'
// ✅ Import TopUpSection
import TopUpSection, { SelectedTopUp, computeTopUpTotal } from '../components/TopUpSection'

export default function CartPage() {
  const router = useRouter()
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  // ── Top-up state ─────────────────────────────────────────────────────────
  const [topUpSelected, setTopUpSelected] = useState<SelectedTopUp[]>([])
  const topUpTotal = computeTopUpTotal(topUpSelected)
  const grandTotal = totalPrice + topUpTotal

  const handleWhatsAppCheckout = () => {
    if (items.length === 0) return

    const orderDetails = items.map(item =>
      `• ${item.name}${item.variant ? ` (${item.variant})` : ''} - Qty: ${item.quantity} - Rs. ${(item.price * item.quantity).toLocaleString()}`
    ).join('\n')

    const topUpDetails = topUpSelected.length > 0
      ? '\n\n*Add-ons:*\n' + topUpSelected.map(s =>
          `• ${s.item.name} x${s.quantity} - Rs. ${(s.item.price * s.quantity).toLocaleString()}`
        ).join('\n')
      : ''

    const message =
      `Hi! I want to place an order:\n\n${orderDetails}${topUpDetails}\n\n` +
      `*Total: Rs. ${grandTotal.toLocaleString()}*\n\nPlease confirm availability and delivery details.`

    const whatsappNumber = '923105717097'
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank')
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={40} className="text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h1>
          <p className="text-gray-500 mb-8">Discover amazing products and add them to your cart</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-sm"
          >
            <ArrowLeft size={20} />
            Start Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors">
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
            <p className="text-sm text-gray-500">{totalItems} {totalItems === 1 ? 'item' : 'items'}</p>
          </div>
          <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors">
            Clear All
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items + Top-Up */}
          <div className="lg:col-span-2 space-y-4">
            {/* Cart items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variant || ''}`} className="flex gap-4 p-6 hover:bg-gray-50 transition-colors">
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                      <Image src={getImageUrl(item.image)} alt={item.name} fill className="object-contain p-2" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{item.name}</h3>
                          {item.variant && <p className="text-sm text-gray-500">{item.variant}</p>}
                        </div>
                        <button onClick={() => removeItem(item.productId, item.variant)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-4">
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variant)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors">
                              <Minus size={16} />
                            </button>
                            <span className="text-base font-semibold w-8 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variant)} className="w-8 h-8 rounded-lg bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center transition-colors">
                              <Plus size={16} />
                            </button>
                          </div>
                          <div className="text-sm text-gray-500">Rs. {item.price.toLocaleString()} each</div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <Link href="/" className="flex items-center justify-center gap-2 text-teal-600 hover:text-teal-700 font-medium transition-colors">
                  <Plus size={18} />
                  Continue Shopping
                </Link>
              </div>
            </div>

            {/* ✅ TOP-UP SECTION — yahan add karo */}
            <TopUpSection onChange={setTopUpSelected} />
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                  <span>Rs. {totalPrice.toLocaleString()}</span>
                </div>

                {/* ✅ Show add-ons line if selected */}
                {topUpTotal > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Add-ons ({topUpSelected.length})</span>
                    <span>Rs. {topUpTotal.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <div className="border-t border-gray-200 pt-4 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-teal-600">Rs. {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons — pass topUpSelected to checkout via query or context */}
              <div className="space-y-3">
                <Link
                  href={`/checkout?topups=${encodeURIComponent(JSON.stringify(topUpSelected))}`}
                  className="block w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-lg font-semibold transition-colors text-center"
                >
                  Proceed to Checkout
                </Link>

                <button
                  onClick={handleWhatsAppCheckout}
                  disabled={isCheckingOut}
                  className="w-full bg-white border-2 border-teal-500 text-teal-600 hover:bg-teal-50 disabled:bg-gray-100 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} />
                  Quick Order via WhatsApp
                </button>

                <div className="text-center">
                  <p className="text-xs text-gray-500">Secure checkout • Free delivery • Easy returns</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-teal-50 rounded-lg border border-teal-100">
                <h3 className="font-semibold text-teal-900 mb-2">Free Delivery</h3>
                <p className="text-sm text-teal-700">Get your order delivered for free within 2-3 business days</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}