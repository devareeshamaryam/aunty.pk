'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface Props {
  /** ISO timestamp the order is expected to arrive. */
  targetAt: string;
}

/**
 * Live countdown to a target ISO timestamp. Updates every second.
 * Renders nothing when target is missing. Shows "Delivered any moment now" past zero.
 */
export default function CountdownTimer({ targetAt }: Props) {
  const target = new Date(targetAt).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!Number.isFinite(target)) return null;

  const diff = Math.max(0, target - now);
  const overdue = target - now < 0;
  const totalSec = Math.floor(diff / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-3 bg-white/95 backdrop-blur-sm border border-white/60 rounded-2xl px-5 py-3 shadow-lg"
    >
      <Clock className="w-5 h-5 text-cyan-600" />
      {overdue ? (
        <p className="text-sm font-bold text-emerald-600">
          Should be there any moment ✨
        </p>
      ) : (
        <div className="flex items-baseline gap-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
            Arriving in
          </span>
          <motion.span
            key={mins}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18 }}
            className="text-2xl font-extrabold text-gray-900 tabular-nums leading-none"
          >
            {String(mins).padStart(2, '0')}
          </motion.span>
          <span className="text-base font-bold text-gray-400">:</span>
          <motion.span
            key={secs}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18 }}
            className="text-2xl font-extrabold text-gray-900 tabular-nums leading-none"
          >
            {String(secs).padStart(2, '0')}
          </motion.span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 ml-1">
            min
          </span>
        </div>
      )}
    </motion.div>
  );
}
