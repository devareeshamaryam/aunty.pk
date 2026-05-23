'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FloatingCartBarProps {
  /** kept for backwards-compat; clicking the bar now navigates to /cart */
  onOpenCart?: () => void;
}

// Pages where the floating bar would be redundant or in the way
const HIDDEN_ON = ['/cart', '/checkout', '/order-success', '/dashboard', '/auth'];

export default function FloatingCartBar(_: FloatingCartBarProps) {
  const { totalItems, totalPrice } = useCart();
  const pathname = usePathname() || '';
  const [bump, setBump] = useState(false);
  /** Visible state — bar hides while user scrolls down, reappears on scroll-up */
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (totalItems === 0) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 400);
    return () => clearTimeout(t);
  }, [totalItems]);

  // Scroll-aware visibility so the bar never permanently blocks an
  // "Add to cart" button on the page below it.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let lastY = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY;
        // Hide on downward scroll past a small threshold; show on any upward scroll or near top.
        if (y < 80) {
          setVisible(true);
        } else if (delta > 6) {
          setVisible(false);
        } else if (delta < -6) {
          setVisible(true);
        }
        lastY = y;
        raf = 0;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  if (totalItems === 0) return null;
  if (HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(p + '/'))) return null;

  return (
    <div
      className={`fixed bottom-4 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[440px] z-50 transition-transform duration-300 ease-out ${visible ? 'translate-y-0' : 'translate-y-[140%]'
        }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <Link
        href="/cart"
        className={`group w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 active:scale-[0.98] text-white rounded-2xl py-3 px-4 flex items-center justify-between shadow-2xl shadow-cyan-500/40 transition-all duration-200 ${bump ? 'animate-cart-bounce' : ''
          }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShoppingCart size={18} />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 text-amber-900 rounded-full text-[10px] font-extrabold flex items-center justify-center shadow">
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          </div>
          <div className="text-left min-w-0">
            <p className="text-[10px] uppercase font-bold tracking-wider text-cyan-100 leading-none">
              View Cart
            </p>
            <p className="text-base font-extrabold leading-tight truncate">
              Rs. {totalPrice.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 font-bold text-sm bg-white/15 px-3 py-1.5 rounded-xl group-hover:bg-white/25 transition-colors">
          Checkout
          <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </Link>
    </div>
  );
}
