'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

type Status =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'RIDER_ON_WAY'
  | 'DELIVERED'
  | 'CANCELLED';

interface StatusCopy {
  gif: string;
  title: string;
  subtitle: string;
  /** Hex tint used for glow + accent text. */
  accent: string;
}

const COPY: Record<Exclude<Status, 'CANCELLED'>, StatusCopy> = {
  PLACED: {
    gif: '/order-status/placed.gif',
    title: 'Order Placed',
    subtitle: 'Wait! Aunty will confirm your order shortly!',
    accent: '#22d3ee',
  },
  CONFIRMED: {
    gif: '/order-status/confirmed.gif',
    title: 'Confirmed',
    subtitle: 'Aunty is reviewing your order',
    accent: '#06b6d4',
  },
  PREPARING: {
    gif: '/order-status/preparing.gif',
    title: 'Preparing',
    subtitle: 'Aunty is cooking your food with love',
    accent: '#06b6d4',
  },
  RIDER_ON_WAY: {
    gif: '/order-status/on-the-way.gif',
    title: 'On the Way',
    subtitle: 'The rider is heading to you',
    accent: '#14b8a6',
  },
  DELIVERED: {
    gif: '/order-status/delivered.gif',
    title: 'Delivered',
    subtitle: 'Enjoy your meal!',
    accent: '#10b981',
  },
};

interface Props {
  status: Status;
  /**
   * Optional render-prop slot rendered as a centered overlay below the GIF
   * (used to mount the live countdown directly on the dark stage).
   */
  overlay?: React.ReactNode;
}

export default function OrderTrackAnimation({ status, overlay }: Props) {
  // CANCELLED gets its own treatment — no GIF available.
  if (status === 'CANCELLED') {
    return <CancelledStage />;
  }

  const data = COPY[status];

  // Preload neighbouring statuses for snappy transitions.
  const preloads = useMemo(() => Object.values(COPY).map((c) => c.gif), []);

  return (
    <div
      className="relative overflow-hidden w-screen -ml-[50vw] left-1/2"
      style={{
        background: '#000000',
      }}
    >



      {/* Hidden preloads */}
      <div className="hidden">
        {preloads.map((g) => (
          <img key={g} src={g} alt="" />
        ))}
      </div>

      <div className="relative px-4 sm:px-6 pt-3 sm:pt-4 pb-3 sm:pb-4 flex flex-col items-center text-center max-w-[1100px] mx-auto">


        {/* GIF stage — fixed aspect so layout never jumps */}
        <div className="relative w-full max-w-[240px] sm:max-w-[300px] aspect-square">
          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Image
                src={data.gif}
                alt={data.title}
                fill
                priority
                unoptimized
                sizes="260px"
                className="object-contain"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Countdown clock — below the GIF */}
        {overlay && (
          <div className="mt-2 sm:mt-3 flex justify-center">
            {overlay}
          </div>
        )}

        {/* Animated title + subtitle */}
        <AnimatePresence mode="wait">
          <motion.div
            key={status + '-text'}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mt-2 sm:mt-3"
          >
            <h2
              className="text-xl sm:text-2xl font-extrabold tracking-tight"
              style={{
                background: `linear-gradient(180deg, #ffffff 0%, ${data.accent} 140%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              <TypingText text={data.title} />
            </h2>
            <p className="text-sm text-white/60 mt-1.5 max-w-xs mx-auto">
              {data.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Live indicator dots */}
        <div className="flex items-center gap-1.5 mt-2">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="block w-1.5 h-1.5 rounded-full"
              style={{ background: data.accent }}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                delay: i * 0.18,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Tiny letter-by-letter reveal so the heading feels alive on each transition. */
function TypingText({ text }: { text: string }) {
  return (
    <span aria-label={text}>
      {text.split('').map((ch, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.04 * i }}
          className="inline-block"
          style={{ whiteSpace: 'pre' }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}

/** Diagonal moving shine — adds the "premium" film-set feeling. */
function Shine() {
  return (
    <motion.div
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      initial={{ backgroundPosition: '-200% 0' }}
      animate={{ backgroundPosition: '200% 0' }}
      transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      style={{
        backgroundImage:
          'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.05) 50%, transparent 70%)',
        backgroundSize: '200% 100%',
      }}
    />
  );
}

function CancelledStage() {
  return (
    <div
      className="relative overflow-hidden w-screen -ml-[50vw] left-1/2 text-center px-6 py-8"
      style={{
        background: '#000000',
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(60% 60% at 50% 30%, #f8717122 0%, transparent 70%)' }} />
      <div className="relative">
        <motion.div
          className="mx-auto w-20 h-20 rounded-full border-2 border-rose-400/40 flex items-center justify-center"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-3xl">×</span>
        </motion.div>
        <h2 className="mt-4 text-2xl font-extrabold text-rose-200">Order Cancelled</h2>
        <p className="text-sm text-rose-200/60 mt-1">
          Hope to serve you again next time.
        </p>
      </div>
    </div>
  );
}
