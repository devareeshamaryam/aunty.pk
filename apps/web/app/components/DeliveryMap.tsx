'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, MapPin, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Custom teal pin
const pinIcon = L.divIcon({
  className: 'aunty-delivery-pin',
  html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;">
    <div style="width:36px;height:36px;border-radius:50%;
      background:linear-gradient(135deg,#06b6d4 0%,#0891b2 100%);
      border:3px solid white;
      box-shadow:0 6px 20px rgba(8,145,178,0.45);
      display:flex;align-items:center;justify-content:center;color:white;font-size:16px;">📍</div>
    <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;
      border-top:8px solid #0891b2;margin-top:-2px;"></div>
  </div>`,
  iconSize: [40, 50],
  iconAnchor: [20, 50],
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 16);
  }, [lat, lng, map]);
  return null;
}

interface Props {
  lat?: number;
  lng?: number;
  /** Used to geocode if lat/lng not provided. */
  address?: string;
  customerName?: string;
  height?: number;
  showActionBar?: boolean;
}

/**
 * Display-only delivery location map (Leaflet + Google roadmap tiles).
 * Prefers explicit lat/lng; falls back to geocoding `address` via Nominatim.
 */
export default function DeliveryMap({
  lat,
  lng,
  address,
  customerName,
  height = 260,
  showActionBar = true,
}: Props) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    lat != null && lng != null ? { lat, lng } : null,
  );
  const [loading, setLoading] = useState(lat == null || lng == null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (lat != null && lng != null) {
      setCoords({ lat, lng });
      setLoading(false);
      return;
    }
    if (!address) {
      setLoading(false);
      setError(true);
      return;
    }
    setLoading(true);
    setError(false);
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (data?.[0]) {
          setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [lat, lng, address]);

  if (loading) {
    return (
      <div
        className="rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center"
        style={{ height }}
      >
        <Loader2 className="w-5 h-5 animate-spin text-cyan-500 mr-2" />
        <span className="text-sm text-cyan-600 font-medium">Loading map…</span>
      </div>
    );
  }

  if (error || !coords) {
    return (
      <div
        className="rounded-2xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center gap-2"
        style={{ height }}
      >
        <MapPin className="w-8 h-8 text-gray-300" />
        <p className="text-sm text-gray-400 font-medium">Location not available</p>
        {address && <p className="text-xs text-gray-300 text-center max-w-xs">{address}</p>}
      </div>
    );
  }

  const googleMapsUrl = `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;

  return (
    <div className="rounded-2xl overflow-hidden border border-cyan-100 shadow-sm">
      <div style={{ height }}>
        <MapContainer
          center={[coords.lat, coords.lng]}
          zoom={16}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
          zoomControl
        >
          <TileLayer
            attribution="&copy; Google Maps"
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          />
          <Recenter lat={coords.lat} lng={coords.lng} />
          <Marker position={[coords.lat, coords.lng]} icon={pinIcon}>
            <Popup>
              <div className="text-sm font-semibold">{customerName || 'Delivery'}</div>
              {address && <div className="text-xs text-gray-500">{address}</div>}
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {showActionBar && (
        <div className="bg-white border-t border-cyan-100 px-3 py-2 flex items-center justify-between">
          <p className="text-xs text-gray-500 truncate flex-1 mr-3">
            <MapPin className="inline w-3 h-3 mr-1 text-cyan-500" />
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </p>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors"
          >
            <Navigation className="w-3 h-3" /> Open in Google Maps
          </a>
        </div>
      )}
    </div>
  );
}
