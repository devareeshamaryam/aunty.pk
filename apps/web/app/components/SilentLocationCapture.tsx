'use client';

import { useEffect } from 'react';
import { getSilentLocation, saveSilentLocation } from '../lib/guest';

const TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

/**
 * Silently captures the visitor's GPS location on first load (or when the
 * cached one is older than 7 days) and stores it in localStorage.
 *
 * The customer NEVER sees this in the UI — it's used invisibly when they
 * check out, so admins get an exact map pin alongside the typed street.
 *
 * Renders nothing. Mounted once near the root of the app.
 */
export default function SilentLocationCapture() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('geolocation' in navigator)) return;

    const cached = getSilentLocation();
    if (cached && Date.now() - cached.capturedAt < TTL_MS) return;

    // Defer slightly so we don't compete with first paint
    const id = window.setTimeout(() => {
      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            saveSilentLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            });
          },
          // We swallow errors silently — the order still works without GPS.
          () => {},
          { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
        );
      } catch {
        /* ignore */
      }
    }, 1200);

    return () => window.clearTimeout(id);
  }, []);

  return null;
}
