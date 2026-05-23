'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { fetchBanners, getImageUrl, type BannerItem } from '../lib/api';

/**
 * Full-bleed image-only hero slider.
 * - Crossfade transitions
 * - Autoplay every 5s; pauses on hover; 15s grace after user interaction
 * - Swipe support on touch / drag
 * - Optional per-slide link
 * - Dot navigation
 */
export default function BannerSlider({ intervalMs = 5000 }: { intervalMs?: number }) {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const interactedUntil = useRef<number>(0);
  const dragStartX = useRef<number | null>(null);

  useEffect(() => {
    fetchBanners()
      .then((b) => setBanners(b))
      .catch(() => {});
  }, []);

  const count = banners.length;

  const goto = useCallback(
    (n: number) => setIndex(((n % count) + count) % count),
    [count],
  );
  const next = useCallback(() => goto(index + 1), [goto, index]);
  const prev = useCallback(() => goto(index - 1), [goto, index]);

  useEffect(() => {
    if (!intervalMs || count <= 1) return;
    if (typeof window !== 'undefined') {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    }
    const id = window.setInterval(() => {
      if (paused || Date.now() < interactedUntil.current) return;
      setIndex((i) => (i + 1) % count);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, paused, count]);

  const markInteraction = () => {
    interactedUntil.current = Date.now() + 15_000;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragStartX.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    const diff = e.clientX - dragStartX.current;
    if (Math.abs(diff) > 50) {
      markInteraction();
      if (diff > 0) prev();
      else next();
    }
    dragStartX.current = null;
  };

  if (!count) return null;

  return (
    <section
      className="w-full px-2 sm:px-4 py-2 sm:py-3"
      aria-roledescription="carousel"
      aria-label="Featured promotions"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_12px_40px_-12px_rgba(0,0,0,0.18)] group touch-pan-y select-none cursor-grab active:cursor-grabbing bg-gray-100"
        style={{ display: 'grid' }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {banners.map((b, i) => {
          const active = i === index;
          const img = (
            <>
              <img
                src={getImageUrl(b.imageUrl)}
                alt={b.alt || 'Promotional banner'}
                className={`w-full h-auto block pointer-events-none select-none ${
                  b.imageUrlMobile ? 'hidden sm:block' : ''
                }`}
                draggable={false}
              />
              {b.imageUrlMobile && (
                <img
                  src={getImageUrl(b.imageUrlMobile)}
                  alt={b.alt || 'Promotional banner'}
                  className="w-full h-auto sm:hidden block pointer-events-none select-none"
                  draggable={false}
                />
              )}
            </>
          );

          return (
            <div
              key={b._id}
              className={`col-start-1 row-start-1 transition-opacity duration-700 ease-out ${
                active ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
              }`}
              aria-hidden={!active}
            >
              {b.linkUrl ? (
                <Link
                  href={b.linkUrl}
                  className="block"
                  aria-label={b.alt || `Banner ${i + 1}`}
                  tabIndex={active ? 0 : -1}
                >
                  {img}
                </Link>
              ) : (
                img
              )}
            </div>
          );
        })}

        {/* Dots */}
        {count > 1 && (
          <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 bg-black/30 backdrop-blur-md px-2.5 py-1.5 rounded-full">
            {banners.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  markInteraction();
                  goto(i);
                }}
                aria-label={`Slide ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
                className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                  i === index ? 'w-7 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
