'use client'

import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '../context/CartContext'
import { getImageUrl } from '../lib/api'

interface CartSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { items, totalItems, totalPrice, updateQuantity, removeItem } = useCart()

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[100] transition-opacity"
          onClick={onClose}
          style={{ height: '100vh', width: '100vw' }}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-screen w-full sm:w-[400px] bg-white shadow-2xl z-[101] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-screen">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white flex-shrink-0">
            <h2 className="text-lg font-bold text-gray-900">Your Cart</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Cart Items - Scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-500 text-sm mb-6">Add items to get started</p>
                <Link
                  href="/"
                  onClick={onClose}
                  className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {items.map((item, index) => (
                  <div
                    key={`${item.productId}-${item.variant || ''}`}
                    className="flex gap-3 pb-4 border-b border-gray-100 last:border-0"
                  >
                    {/* Image */}
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
                      <Image
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        fill
                        className="object-contain p-1"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm text-gray-900 line-clamp-2 leading-tight">
                            {item.name}
                          </h3>
                          {item.variant && (
                            <p className="text-xs text-gray-500 mt-1">{item.variant}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item.productId, item.variant)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors ml-2"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variant)}
                            className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-medium w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variant)}
                            className="w-6 h-6 rounded-md bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">
                            Rs. {(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add More Items */}
                <Link
                  href="/"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 text-teal-600 hover:text-teal-700 text-sm font-medium py-3 border border-teal-200 hover:border-teal-300 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  Add more items
                </Link>
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-100 bg-white p-4 space-y-4 flex-shrink-0">
              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-gray-700">Total</span>
                <span className="text-xl font-bold text-gray-900">
                  Rs. {totalPrice.toLocaleString()}
                </span>
              </div>

              {/* Checkout Button */}
              <Link
                href="/checkout"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-lg font-semibold transition-colors shadow-sm"
              >
                Checkout
                <ArrowRight size={18} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

