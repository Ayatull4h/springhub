"use client";

import { useCallback, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet marker icon — pakai divIcon biar tidak perlu load PNG eksternal
import L from "leaflet";
const icon = L.divIcon({
  className: "bg-transparent",
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#6366f1" stroke="white" stroke-width="2" width="28" height="28"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white" stroke="none"/></svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

export type PickerMapProps = {
  initialLat: number;
  initialLng: number;
  onPick: (lat: number, lng: number) => void;
};

/** Komponen internal yang menangani klik pada peta */
function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function PickerMap({ initialLat, initialLng, onPick }: PickerMapProps) {
  const [marker, setMarker] = useState<[number, number]>([initialLat, initialLng]);

  const handleClick = useCallback(
    (lat: number, lng: number) => {
      setMarker([lat, lng]);
      onPick(lat, lng);
    },
    [onPick]
  );

  return (
    <MapContainer
      center={[initialLat, initialLng]}
      zoom={8}
      scrollWheelZoom={true}
      className="h-full w-full"
      style={{ minHeight: 300, height: 300 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={handleClick} />
      <Marker position={marker} icon={icon} />
    </MapContainer>
  );
}
