'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
 import { Navigation, MapPin } from 'lucide-react';

// ── Fix default marker icons (Next.js/Webpack breaks them) ──────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom teal marker
const tealIcon = new L.Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 26 16 26S32 26 32 16C32 7.163 24.837 0 16 0z"
            fill="#14b8a6" filter="url(#shadow)"/>
      <circle cx="16" cy="16" r="7" fill="white"/>
      <circle cx="16" cy="16" r="4" fill="#14b8a6"/>
    </svg>
  `)}`,
  iconSize:     [32, 42],
  iconAnchor:   [16, 42],
  popupAnchor:  [0, -44],
});

// Recenter map when coords change
function Recenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lon], 16); }, [lat, lon]);
  return null;
}

interface Props {
  address: string;
  customerName?: string;
}

export default function DeliveryMapComponent({ address, customerName }: Props) {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [displayAddress, setDisplayAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    setError(false);
    setCoords(null);

    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1`
    )
      .then(r => r.json())
      .then(data => {
        if (data?.[0]) {
          setCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
          setDisplayAddress(data[0].display_name);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [address]);

  if (loading) {
    return (
      <div className="h-64 rounded-2xl bg-teal-50 border border-teal-100 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-[3px] border-teal-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-teal-500 font-semibold">Finding location on map…</p>
      </div>
    );
  }

  if (error || !coords) {
    return (
      <div className="h-64 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center gap-2">
        <MapPin className="w-10 h-10 text-gray-200" />
        <p className="text-sm text-gray-400 font-semibold">Location not found</p>
        <p className="text-xs text-gray-300 text-center max-w-48">{address}</p>
      </div>
    );
  }

  const openMapUrl = `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lon}&zoom=17`;
  const googleMapsUrl = `https://www.google.com/maps?q=${coords.lat},${coords.lon}`;

  return (
    <div className="rounded-2xl overflow-hidden border border-teal-100 shadow-sm">
      {/* Map */}
      <div className="relative" style={{ height: '260px' }}>
        <MapContainer
          center={[coords.lat, coords.lon]}
          zoom={16}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Recenter lat={coords.lat} lon={coords.lon} />
          <Marker position={[coords.lat, coords.lon]} icon={tealIcon}>
            <Popup className="custom-popup" maxWidth={220}>
              <div className="text-sm font-bold text-gray-900 mb-1">
                {customerName || 'Delivery Address'}
              </div>
              <div className="text-xs text-gray-500 leading-relaxed">
                {address}
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Bottom bar */}
      <div className="bg-white border-t border-teal-100 px-4 py-2.5 flex items-center justify-between">
        <p className="text-xs text-gray-400 truncate flex-1 mr-3">
          <MapPin className="inline w-3 h-3 mr-1 text-teal-500" />
          {address}
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors"
          >
            <Navigation className="w-3 h-3" />
            Google Maps
          </a>
          <a
            href={openMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors"
          >
            OSM
          </a>
        </div>
      </div>

      <style>{`
        .leaflet-container { font-family: inherit; border-radius: 0; }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
          border: 1px solid #ccfbf1 !important;
        }
        .leaflet-popup-tip { background: white !important; }
        .leaflet-control-zoom a {
          border-radius: 8px !important;
          border: 1px solid #d1fae5 !important;
          color: #0f766e !important;
          font-weight: bold !important;
        }
        .leaflet-control-zoom a:hover { background: #f0fdfa !important; }
        .leaflet-control-zoom { border: none !important; box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important; }
      `}</style>
    </div>
  );
}