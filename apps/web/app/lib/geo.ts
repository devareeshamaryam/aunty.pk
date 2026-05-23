// Frontend mirror of backend Multan geo guard. Keep in sync with apps/api/src/common/geo.ts.

export const MULTAN_CENTER = { lat: 30.1575, lng: 71.5249 };
export const MULTAN_RADIUS_KM = 30;

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function isWithinMultan(p: { lat: number; lng: number }): boolean {
  return haversineKm(p, MULTAN_CENTER) <= MULTAN_RADIUS_KM;
}

export function isMultanCity(city: string | undefined | null): boolean {
  if (!city) return false;
  const c = city.trim().toLowerCase();
  return ['multan', 'mooltan'].includes(c);
}

/**
 * Best-effort reverse-geocode using OpenStreetMap Nominatim (free, no API key).
 * Returns a human-readable label or null.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data) return null;
    const a = data.address || {};
    const parts = [
      a.house_number,
      a.road || a.pedestrian || a.footway,
      a.neighbourhood || a.suburb || a.quarter,
      a.city || a.town || a.village,
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : data.display_name || null;
  } catch {
    return null;
  }
}
