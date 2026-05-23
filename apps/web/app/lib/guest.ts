/**
 * Guest session — single source of truth for browser-stored customer identity.
 *
 * We do NOT require account creation. Each browser gets a stable guestId.
 * Orders, saved addresses, and (optional) contact info are tied to it.
 */

const GUEST_ID_KEY = 'aunty.guestId';
const GUEST_PROFILE_KEY = 'aunty.guestProfile';
const SAVED_ADDRESSES_KEY = 'aunty.addresses';
const SILENT_LOCATION_KEY = 'aunty.silentLocation';

/**
 * Silent location captured from the browser's geolocation API on first visit.
 * It is NEVER shown to the customer in the UI — only attached invisibly to
 * orders so admins can see the exact map pin alongside the typed street.
 */
export interface SilentLocation {
  lat: number;
  lng: number;
  capturedAt: number;
  accuracy?: number;
}

export function getSilentLocation(): SilentLocation | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SILENT_LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number') return parsed;
    return null;
  } catch {
    return null;
  }
}

export function saveSilentLocation(loc: Omit<SilentLocation, 'capturedAt'>) {
  if (typeof window === 'undefined') return;
  const full: SilentLocation = { ...loc, capturedAt: Date.now() };
  localStorage.setItem(SILENT_LOCATION_KEY, JSON.stringify(full));
}

/** UUID-ish identifier without external deps. */
function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}

export function getGuestId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

export interface GuestProfile {
  name?: string;
  phone?: string;
}

export function getGuestProfile(): GuestProfile {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(GUEST_PROFILE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveGuestProfile(profile: GuestProfile) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
}

// ─── Saved addresses (multi-address, foodpanda-style) ─────────────

export type AddressMode = 'typed' | 'pinned';

export interface SavedAddress {
  id: string;
  label: string; // "Home", "Office", custom
  mode: AddressMode;
  // typed
  street?: string;
  area?: string;
  city?: string;
  phone?: string;
  notes?: string;
  // pinned
  lat?: number;
  lng?: number;
  pinLabel?: string;
  isDefault?: boolean;
  createdAt: number;
}

export function getSavedAddresses(): SavedAddress[] {
  if (typeof window === 'undefined') return [];
  try {
    const arr = JSON.parse(localStorage.getItem(SAVED_ADDRESSES_KEY) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveAddress(addr: Omit<SavedAddress, 'id' | 'createdAt'>): SavedAddress {
  const list = getSavedAddresses();
  const created: SavedAddress = {
    ...addr,
    id: generateId(),
    createdAt: Date.now(),
  };
  if (created.isDefault) list.forEach((a) => (a.isDefault = false));
  if (list.length === 0) created.isDefault = true;
  list.push(created);
  localStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(list));
  return created;
}

export function updateAddress(id: string, patch: Partial<SavedAddress>) {
  const list = getSavedAddresses();
  const idx = list.findIndex((a) => a.id === id);
  if (idx === -1) return;
  if (patch.isDefault) list.forEach((a) => (a.isDefault = false));
  list[idx] = { ...list[idx], ...patch };
  localStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(list));
}

export function deleteAddress(id: string) {
  const list = getSavedAddresses().filter((a) => a.id !== id);
  if (list.length && !list.some((a) => a.isDefault)) list[0].isDefault = true;
  localStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(list));
}

export function getDefaultAddress(): SavedAddress | undefined {
  const list = getSavedAddresses();
  return list.find((a) => a.isDefault) || list[0];
}
