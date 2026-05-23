'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const LOGO_URL = 'https://aunty.pk/cdn/b16522a7ea93d5ddc22d70a7ec60f0bb.png';

type Status =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'RIDER_ON_WAY'
  | 'DELIVERED'
  | 'CANCELLED';

// Every active stage uses the brand cyan→teal palette so the page feels
// like a single cohesive experience instead of a colour-coded status board.
const COPY: Record<Status, { title: string; subtitle: string; emoji: string; bg: string }> = {
  PLACED: {
    title: 'Order received',
    subtitle: 'Aunty is reading your order…',
    emoji: '📝',
    bg: 'from-cyan-50 via-teal-50 to-cyan-100',
  },
  CONFIRMED: {
    title: 'Order confirmed',
    subtitle: 'Aunty has approved your order',
    emoji: '✅',
    bg: 'from-cyan-50 via-teal-50 to-cyan-100',
  },
  PREPARING: {
    title: 'Cooking…',
    subtitle: 'Aunty is making your food with love',
    emoji: '🍳',
    bg: 'from-cyan-50 via-teal-50 to-cyan-100',
  },
  RIDER_ON_WAY: {
    title: 'On the way',
    subtitle: 'The rider is heading to you',
    emoji: '🛵',
    bg: 'from-cyan-50 via-teal-50 to-cyan-100',
  },
  DELIVERED: {
    title: 'Delivered!',
    subtitle: 'Enjoy your meal 🥰',
    emoji: '🎉',
    bg: 'from-emerald-50 via-green-50 to-emerald-100',
  },
  CANCELLED: {
    title: 'Order cancelled',
    subtitle: 'Hope to serve you next time',
    emoji: '😔',
    bg: 'from-red-50 via-rose-50 to-red-100',
  },
};

export default function AuntyMascot({ status }: { status: Status }) {
  const data = COPY[status];

  // Each status gets its own subtle motion choreography
  const mascotAnim = (() => {
    switch (status) {
      case 'PREPARING':
        return {
          // gentle stir / cook bobbing
          animate: { y: [0, -6, 0], rotate: [-2, 2, -2] },
          transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'RIDER_ON_WAY':
        return {
          // ride wobble across
          animate: { x: [-8, 8, -8], rotate: [-4, 4, -4] },
          transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'DELIVERED':
        return {
          // celebrate hop
          animate: { y: [0, -16, 0], scale: [1, 1.08, 1] },
          transition: { duration: 1, repeat: Infinity, ease: 'easeOut' as const },
        };
      case 'CANCELLED':
        return {
          animate: { rotate: [-1, 1, -1] },
          transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' as const },
        };
      case 'CONFIRMED':
        return {
          animate: { scale: [1, 1.05, 1] },
          transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
        };
      default: // PLACED
        return {
          animate: { y: [0, -6, 0] },
          transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' as const },
        };
    }
  })();

  return (
    <div
      className={`relative rounded-3xl bg-gradient-to-br ${data.bg} overflow-hidden border border-white/60 shadow-inner`}
    >
      {/* Decorative orbs */}
      <div className="absolute -top-12 -right-10 w-44 h-44 bg-white/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-12 w-52 h-52 bg-white/30 rounded-full blur-3xl pointer-events-none" />

      {/* Confetti for DELIVERED */}
      {status === 'DELIVERED' && <Confetti />}

      {/* Steam wisps for PREPARING */}
      {status === 'PREPARING' && <SteamWisps />}

      <div className="relative px-6 py-7 sm:py-9 flex flex-col items-center text-center">
        <motion.div
          className="relative w-32 h-32 sm:w-40 sm:h-40"
          {...mascotAnim}
        >
          <Image
            src={LOGO_URL}
            alt="Aunty"
            fill
            className="object-contain drop-shadow-lg"
            priority
            sizes="160px"
          />
          {/* Emoji badge */}
          <motion.span
            className="absolute -bottom-1 -right-2 w-10 h-10 rounded-full bg-white shadow-lg ring-2 ring-white flex items-center justify-center text-lg"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.6, ease: 'backOut' }}
            key={status}
          >
            {data.emoji}
          </motion.span>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="mt-4 sm:mt-5"
          >
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
              {data.title}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{data.subtitle}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function SteamWisps() {
  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-3 pointer-events-none">
      {[0, 0.4, 0.8].map((delay, i) => (
        <motion.span
          key={i}
          className="block w-1.5 h-6 bg-white/70 rounded-full blur-sm"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: -30, opacity: [0, 0.9, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 18 });
  const colors = ['#06b6d4', '#facc15', '#f97316', '#22c55e', '#a855f7', '#ec4899'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map((_, i) => {
        const left = (i * 53) % 100;
        const delay = (i % 6) * 0.2;
        const duration = 2.6 + (i % 5) * 0.3;
        const color = colors[i % colors.length];
        return (
          <motion.span
            key={i}
            className="absolute w-1.5 h-3 rounded-sm"
            style={{ left: `${left}%`, background: color, top: -20 }}
            animate={{ y: ['0%', '600%'], rotate: [0, 360] }}
            transition={{ duration, repeat: Infinity, delay, ease: 'easeIn' }}
          />
        );
      })}
    </div>
  );
}
