'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  getGuestId,
  getGuestProfile,
  saveGuestProfile,
  getSavedAddresses,
  saveAddress as saveAddressLs,
  updateAddress as updateAddressLs,
  deleteAddress as deleteAddressLs,
  getSilentLocation,
  saveSilentLocation,
  type GuestProfile,
  type SavedAddress,
  type SilentLocation,
} from '../lib/guest';

interface GuestContextType {
  guestId: string;
  profile: GuestProfile;
  setProfile: (p: GuestProfile) => void;
  /** @deprecated kept for backward compat — UI no longer surfaces saved addresses. */
  addresses: SavedAddress[];
  addAddress: (a: Omit<SavedAddress, 'id' | 'createdAt'>) => SavedAddress;
  patchAddress: (id: string, patch: Partial<SavedAddress>) => void;
  removeAddress: (id: string) => void;
  refreshAddresses: () => void;
  /**
   * Silently captured browser geolocation. Attached invisibly to orders so
   * admins see the exact map pin while customers only ever type a street.
   */
  silentLocation: SilentLocation | null;
  /** Manually re-request the browser geolocation prompt. */
  captureLocation: () => void;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export function GuestProvider({ children }: { children: React.ReactNode }) {
  const [guestId, setGuestId] = useState('');
  const [profile, setProfileState] = useState<GuestProfile>({});
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [silentLocation, setSilentLocation] = useState<SilentLocation | null>(null);

  useEffect(() => {
    setGuestId(getGuestId());
    setProfileState(getGuestProfile());
    setAddresses(getSavedAddresses());
    setSilentLocation(getSilentLocation());
  }, []);

  const captureLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        saveSilentLocation(loc);
        setSilentLocation({ ...loc, capturedAt: Date.now() });
      },
      () => {
        // Permission denied or unavailable — silent failure is fine,
        // the customer can still place an order with just the street.
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5 * 60_000 },
    );
  }, []);

  /**
   * Site-wide silent geolocation prompt. Runs once per browser as soon as
   * the customer lands on any page. If denied, we never show an error —
   * the order just won't carry GPS coords.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Only re-prompt if we don't already have a recent capture (< 24h old).
    const existing = getSilentLocation();
    if (existing && Date.now() - existing.capturedAt < 24 * 60 * 60_000) return;
    // Defer slightly so the page paints before the OS permission prompt.
    const t = setTimeout(() => captureLocation(), 1200);
    return () => clearTimeout(t);
  }, [captureLocation]);

  const setProfile = useCallback((p: GuestProfile) => {
    saveGuestProfile(p);
    setProfileState(p);
  }, []);

  const refreshAddresses = useCallback(() => {
    setAddresses(getSavedAddresses());
  }, []);

  const addAddress = useCallback(
    (a: Omit<SavedAddress, 'id' | 'createdAt'>) => {
      const created = saveAddressLs(a);
      setAddresses(getSavedAddresses());
      return created;
    },
    [],
  );

  const patchAddress = useCallback((id: string, patch: Partial<SavedAddress>) => {
    updateAddressLs(id, patch);
    setAddresses(getSavedAddresses());
  }, []);

  const removeAddress = useCallback((id: string) => {
    deleteAddressLs(id);
    setAddresses(getSavedAddresses());
  }, []);

  return (
    <GuestContext.Provider
      value={{
        guestId,
        profile,
        setProfile,
        addresses,
        addAddress,
        patchAddress,
        removeAddress,
        refreshAddresses,
        silentLocation,
        captureLocation,
      }}
    >
      {children}
    </GuestContext.Provider>
  );
}

export function useGuest(): GuestContextType {
  const ctx = useContext(GuestContext);
  if (!ctx) throw new Error('useGuest must be used within GuestProvider');
  return ctx;
}
