// Multan coverage: 30km radius around city center.
// Coordinates: Multan Cantt area.
export const MULTAN_CENTER = { lat: 30.1575, lng: 71.5249 };
export const MULTAN_RADIUS_KM = 30;

/** Haversine distance in kilometers between two lat/lng points. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function isWithinMultan(point: { lat: number; lng: number }): boolean {
  return haversineKm(point, MULTAN_CENTER) <= MULTAN_RADIUS_KM;
}

/** Lightweight city-name check: trims, lowercases, accepts common Multan spellings. */
export function isMultanCity(city: string | undefined | null): boolean {
  if (!city) return false;
  const c = city.trim().toLowerCase();
  return ['multan', 'mooltan', 'مولتان', 'ملتان'].includes(c);
}
