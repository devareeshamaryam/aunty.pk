'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  /** ISO timestamp the order is expected to arrive. */
  targetAt: string;
  /**
   * ISO timestamp marking when the timer started (i.e. when the admin set
   * the ETA). Used to draw the progress bar. Falls back to `targetAt - 30min`.
   */
  startedAt?: string;
  /** Hex accent colour — defaults to cyan. */
  accent?: string;
}

/**
 * Minimal animated countdown — just digits + a thin progress bar.
 * Disappears automatically when the countdown reaches zero.
 */
export default function ClockCountdown({
  targetAt,
  startedAt,
  accent = '#22d3ee',
}: Props) {
  const target = useMemo(() => new Date(targetAt).getTime(), [targetAt]);
  const start = useMemo(() => {
    if (startedAt) return new Date(startedAt).getTime();
    return target - 30 * 60_000;
  }, [target, startedAt]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!Number.isFinite(target)) return null;

  const totalMs = Math.max(target - start, 60_000);
  const remainingMs = Math.max(0, target - now);
  const done = remainingMs <= 0;

  // Hide when countdown finishes
  if (done) return null;

  const totalSec = Math.floor(remainingMs / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;

  // Progress (1 → 0) as time elapses
  const progress = Math.min(1, Math.max(0, remainingMs / totalMs));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8, scale: 0.95 }}
        transition={{ duration: 0.4 }}
        className="inline-flex flex-col items-center gap-2"
      >
        {/* Label */}
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50">
          Arriving in
        </span>

        {/* Digits */}
        <div className="flex items-baseline gap-0.5 tabular-nums">
          <Digit value={Math.floor(mins / 10)} accent={accent} />
          <Digit value={mins % 10} accent={accent} />
          <motion.span
            className="text-lg font-bold mx-0.5"
            style={{ color: accent }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          >
            :
          </motion.span>
          <Digit value={Math.floor(secs / 10)} accent={accent} />
          <Digit value={secs % 10} accent={accent} />
        </div>

        {/* Thin progress bar */}
        <div className="w-28 h-1 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: accent }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.9, ease: 'linear' }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/** Single animated digit box */
function Digit({ value, accent }: { value: number; accent: string }) {
  return (
    <div
      className="relative w-7 h-9 rounded-md flex items-center justify-center overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.06)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={{ y: -14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 14, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="text-xl font-extrabold text-white leading-none"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
