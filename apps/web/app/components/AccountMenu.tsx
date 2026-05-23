'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { User, Package, ChevronDown, Star } from 'lucide-react';
import { useGuest } from '../context/GuestContext';

interface Props {
  variant?: 'light' | 'dark';
}

export default function AccountMenu({ variant = 'dark' }: Props) {
  const { profile } = useGuest();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const textColor = variant === 'light' ? 'text-white' : 'text-cyan-700';
  const hoverBg = variant === 'light' ? 'hover:bg-white/15' : 'hover:bg-cyan-50';

  const label = profile.name ? profile.name.split(' ')[0] : 'Account';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-full font-semibold text-sm transition-all active:scale-95 ${textColor} ${hoverBg}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={`w-7 h-7 rounded-full flex items-center justify-center ${variant === 'light' ? 'bg-white/20' : 'bg-cyan-100'}`}>
          <User className="w-4 h-4" strokeWidth={2.5} />
        </span>
        <span className="hidden sm:inline">{label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={2.5}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-scale-in origin-top-left"
        >
          <div className="px-4 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white">
            <div className="text-xs opacity-90">Hi there 👋</div>
            <div className="text-sm font-bold truncate">
              {profile.name || 'Guest user'}
            </div>
            {profile.phone && (
              <div className="text-[11px] opacity-90 mt-0.5">{profile.phone}</div>
            )}
          </div>

          <div className="py-1">
            <MenuLink href="/account/orders" icon={<Package className="w-4 h-4" />} label="My Orders" onClick={() => setOpen(false)} />
            <MenuLink href="/account/reviews" icon={<Star className="w-4 h-4" />} label="My Reviews" onClick={() => setOpen(false)} />
            <div className="border-t border-gray-100 my-1" />
            <MenuLink href="/account" icon={<User className="w-4 h-4" />} label="Account Settings" onClick={() => setOpen(false)} />
          </div>

          <div className="px-4 py-2 bg-gray-50 text-[10px] text-gray-500 text-center">
            No sign-up required — your info stays on your device.
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors"
      role="menuitem"
    >
      <span className="text-cyan-500">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
