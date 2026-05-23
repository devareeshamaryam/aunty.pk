'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Home, ShoppingBag } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10 bg-gradient-to-br from-cyan-50 via-white to-amber-50">
      <div className="absolute -top-40 -left-40 w-[28rem] h-[28rem] bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[28rem] h-[28rem] bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="bg-white/85 backdrop-blur-md rounded-3xl shadow-[0_20px_60px_-20px_rgba(8,145,178,0.25)] border border-white/60 p-8 text-center animate-fade-up">
          {/* Logo */}
          <div className="flex items-center justify-center mb-3">
            <Image
              src="/image63.png"
              alt="Aunty.pk"
              width={140}
              height={140}
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
              style={{
                filter:
                  'drop-shadow(0px 5px 0px rgba(8,145,178,0.20)) drop-shadow(0px 10px 14px rgba(0,0,0,0.12))',
              }}
              priority
            />
          </div>

          {/* Giant 404 */}
          <p className="text-7xl sm:text-8xl font-black bg-gradient-to-br from-cyan-500 via-cyan-600 to-teal-600 bg-clip-text text-transparent leading-none tracking-tight">
            404
          </p>

          <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 mt-3">
            Page not found
          </h1>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 mt-6">
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold text-sm shadow-lg shadow-cyan-500/30 active:scale-[0.98] transition-all"
            >
              <Home className="w-4 h-4" /> Home
            </Link>
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm border border-gray-200 active:scale-[0.98] transition-all"
            >
              <ShoppingBag className="w-4 h-4" /> Browse Menu
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
