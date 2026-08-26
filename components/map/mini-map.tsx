"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Pakai divIcon biar tidak perlu load PNG eksternal (offline 404 & CSP)
const defaultIcon = L.divIcon({
  className: "bg-transparent",
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#6366f1" stroke="white" stroke-width="2" width="28" height="28"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white" stroke="none"/></svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

export default function MiniMap({
  lat,
  lng,
  zoom = 13,
}: {
  lat: number;
  lng: number;
  zoom?: number;
}) {
  return (
    <div className="mini-map-container aspect-[4/1] w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
        attributionControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={defaultIcon}>
          <Popup>
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
