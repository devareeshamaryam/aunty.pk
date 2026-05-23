'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchPublicSettings, type PublicSettings } from '../lib/api';

/**
 * Sensible fallbacks if the API is unreachable or settings haven't been
 * configured yet. Keep these in one place — never hardcode contact info
 * anywhere else in the app.
 */
const FALLBACK_PHONE = '03105717097';
const FALLBACK_WHATSAPP = '923105717097';
const FALLBACK_STORE_NAME = 'Aunty.pk';

interface StoreContact {
  /** Local PK format e.g. "03105717097" — for tel: links and display. */
  phone: string;
  /** International format for wa.me e.g. "923105717097". */
  whatsapp: string;
  /** Pretty version for display e.g. "0310 5717097". */
  phoneDisplay: string;
  storeName: string;
}

interface SettingsContextValue extends StoreContact {
  settings: PublicSettings | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/** Format "03105717097" → "0310 5717097". */
function prettyPhone(p: string): string {
  const digits = p.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) {
    return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  }
  return p;
}

/** Convert any input into local "03xxxxxxxxx" form for tel: links. */
function toLocalPhone(input?: string): string {
  if (!input) return FALLBACK_PHONE;
  const d = input.replace(/\D/g, '');
  if (d.startsWith('92') && d.length === 12) return '0' + d.slice(2);
  if (d.startsWith('0') && d.length === 11) return d;
  if (d.length === 10) return '0' + d;
  return input;
}

/** Convert any input into international "92xxxxxxxxxx" form for wa.me. */
function toIntlPhone(input?: string): string {
  if (!input) return FALLBACK_WHATSAPP;
  const d = input.replace(/\D/g, '');
  if (d.startsWith('92') && d.length === 12) return d;
  if (d.startsWith('0') && d.length === 11) return '92' + d.slice(1);
  if (d.length === 10) return '92' + d;
  return input;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const s = await fetchPublicSettings();
      setSettings(s);
    } catch {
      // Network/API issues — keep current settings, fall back to defaults.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const phone = toLocalPhone(settings?.store.phone);
  const whatsapp = toIntlPhone(settings?.store.whatsapp || settings?.store.phone);
  const phoneDisplay = prettyPhone(phone);
  const storeName = settings?.store.name || FALLBACK_STORE_NAME;

  return (
    <SettingsContext.Provider
      value={{ settings, loading, refresh, phone, whatsapp, phoneDisplay, storeName }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used inside <SettingsProvider>');
  }
  return ctx;
}

/** Convenience hook when you only care about contact info. */
export function useStoreContact(): StoreContact {
  const { phone, whatsapp, phoneDisplay, storeName } = useSettings();
  return { phone, whatsapp, phoneDisplay, storeName };
}
