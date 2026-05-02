 'use client'

import { useCart } from '../context/CartContext'
import { ShoppingCart } from 'lucide-react'

interface FloatingCartBarProps {
  onOpenCart: () => void
}

export default function FloatingCartBar({ onOpenCart }: FloatingCartBarProps) {
  const { totalItems, totalPrice } = useCart()

  if (totalItems === 0) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[340px] sm:w-[420px]">
      <button
        onClick={onOpenCart}
        className="w-full bg-teal-500 hover:bg-teal-600 active:scale-95 text-white rounded-2xl py-3 px-5 flex items-center justify-between shadow-xl transition-all duration-200"
      >
        {/* Left: item count circle */}
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
          {totalItems}
        </div>

        {/* Center: View Cart */}
        <span className="font-semibold text-base flex-1 text-center">View Cart</span>

        {/* Right: price + icon */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="font-bold text-sm">Rs. {totalPrice.toLocaleString()}</span>
          <ShoppingCart size={16} />
        </div>
      </button>
    </div>
  )
}