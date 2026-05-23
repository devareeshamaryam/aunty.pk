'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStoreContact } from '../context/SettingsContext';
import { getImageUrl } from '../lib/api';
import { openWhatsApp } from '../lib/whatsapp';
import WhatsAppIcon from '../components/icons/WhatsAppIcon';
import CartRecommendations from '../components/CartRecommendations';

export default function CartPage() {
  const router = useRouter();
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart();
  const { whatsapp } = useStoreContact();
  const grandTotal = totalPrice;

  const handleWhatsAppCheckout = () => {
    if (items.length === 0) return;
    const lines = items
      .map(
        (item) =>
          `• ${item.name}${item.variant ? ` (${item.variant})` : ''} – Qty ${item.quantity} – Rs. ${(item.price * item.quantity).toLocaleString()}`,
      )
      .join('\n');
    const message = `Hi! I want to place an order:\n\n${lines}\n\n*Total: Rs. ${grandTotal.toLocaleString()}*\n\nPlease confirm.`;
    openWhatsApp(whatsapp, message);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <ShoppingBag size={36} className="text-gray-400" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-500 text-sm mb-6">
            Discover Aunty\'s menu and start ordering.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm"
          >
            <ArrowLeft size={18} />
            Browse menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-28 sm:pb-12">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 py-3 flex items-center justify-between gap-2">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="text-center min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">Your Cart</h1>
            <p className="text-[11px] text-gray-500">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </p>
          </div>
          <button
            onClick={clearCart}
            className="text-xs sm:text-sm text-red-500 hover:text-red-600 font-medium transition-colors px-2"
          >
            Clear
          </button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-3 sm:px-5 py-4 sm:py-6 grid lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          <ul className="divide-y divide-gray-100 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {items.map((item) => (
              <li
                key={`${item.productId}-${item.variant || ''}`}
                className="flex gap-3 p-3 sm:p-4"
              >
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
                  <Image
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-contain p-1"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-2 leading-tight">
                        {item.name}
                      </h3>
                      {item.variant && (
                        <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                          {item.variant}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.productId, item.variant)}
                      className="p-1.5 -mr-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      aria-label="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1.5">
                    <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1, item.variant)
                        }
                        className="w-7 h-7 rounded-full bg-white text-gray-700 hover:bg-cyan-50 flex items-center justify-center active:scale-95 shadow-sm"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-7 text-center text-sm font-bold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1, item.variant)
                        }
                        className="w-7 h-7 rounded-full bg-cyan-500 text-white hover:bg-cyan-600 flex items-center justify-center active:scale-95 shadow"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-gray-900 whitespace-nowrap">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 text-cyan-600 hover:text-cyan-700 font-medium text-sm py-3 border border-cyan-200 hover:border-cyan-300 rounded-xl transition-colors"
          >
            <Plus size={16} />
            Add more items
          </Link>
        </div>

        {/* Summary (desktop) */}
        <aside className="hidden lg:block lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
            <h2 className="text-base font-bold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>Rs. {totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span className="text-gray-400 text-xs">at checkout</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between text-base font-bold text-gray-900">
                <span>Total</span>
                <span className="text-cyan-600">Rs. {grandTotal.toLocaleString()}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="block w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white py-3 rounded-xl font-bold text-center transition-colors shadow-md shadow-cyan-500/30 active:scale-[0.98]"
            >
              Proceed to Checkout
            </Link>
            <button
              onClick={handleWhatsAppCheckout}
              className="w-full mt-2 bg-white border-2 border-[#25D366] text-[#1DA851] hover:bg-[#25D366]/5 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <WhatsAppIcon size={18} />
              Order via WhatsApp
            </button>
          </div>
        </aside>
      </div>

      {/* Recommendations — same component used on single-product pages */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-5 mt-2 sm:mt-4">
        <CartRecommendations cartProductIds={items.map((i) => i.productId)} />
      </div>

      {/* Mobile sticky bottom checkout bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200 px-3 py-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.12)]">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-[10px] uppercase font-semibold text-gray-500 leading-none">
              Total
            </p>
            <p className="text-base font-extrabold text-gray-900 leading-tight">
              Rs. {grandTotal.toLocaleString()}
            </p>
          </div>
          <Link
            href="/checkout"
            className="flex-1 ml-3 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold text-sm inline-flex items-center justify-center gap-1.5 active:scale-[0.98] shadow-lg shadow-cyan-500/30"
          >
            Checkout
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
