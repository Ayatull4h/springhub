"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Crosshair, LocateFixed } from "lucide-react";
import L from "leaflet";

type SetupMapProps = {
  onAreaSelected: (center: { lat: number; lng: number }, radius: number) => void;
  selectedCenter: { lat: number; lng: number } | null;
  selectedRadius: number; // in km
};

/**
 * SetupMap — pilih area survei lingkaran untuk tile pre-cache.
 * User bisa klik peta untuk memindahkan pusat lingkaran.
 * Radius diubah dari tombol di luar komponen.
 */
function MapCircleController({
  center,
  radiusKm,
  onCenterChange,
}: {
  center: { lat: number; lng: number };
  radiusKm: number;
  onCenterChange: (c: { lat: number; lng: number }) => void;
}) {
  const map = useMap();
  const circleRef = useRef<L.Circle | null>(null);
  const [dragging, setDragging] = useState(false);

  // Set initial view to center
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom());
  }, [map, center]);

  // Listen for map clicks to move circle center
  useMapEvents({
    click(e) {
      onCenterChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  // Add draggable circle
  useEffect(() => {
    if (circleRef.current) {
      map.removeLayer(circleRef.current);
    }

    const circle = L.circle([center.lat, center.lng], {
      radius: radiusKm * 1000,
      color: "#059669",
      weight: 2,
      fillColor: "#059669",
      fillOpacity: 0.1,
      dashArray: "8 4",
    }).addTo(map);

    circleRef.current = circle;

    // Enable drag on the circle
    const handleMouseDown = () => setDragging(true);
    const handleMouseUp = (e: L.LeafletMouseEvent) => {
      if (dragging) {
        onCenterChange({ lat: e.latlng.lat, lng: e.latlng.lng });
        setDragging(false);
      }
    };

    circle.on("mousedown", handleMouseDown);
    map.on("mouseup", handleMouseUp);

    return () => {
      circle.off("mousedown", handleMouseDown);
      map.off("mouseup", handleMouseUp);
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
      }
    };
  }, [map, center, radiusKm, dragging, onCenterChange]);

  return null;
}

export function SetupMap({ onAreaSelected, selectedCenter, selectedRadius }: SetupMapProps) {
  const [center, setCenter] = useState<{ lat: number; lng: number }>(
    selectedCenter ?? { lat: -7.5, lng: 110 }
  );
  const [geoLoading, setGeoLoading] = useState(false);

  const handleCenterChange = useCallback(
    (newCenter: { lat: number; lng: number }) => {
      setCenter(newCenter);
      onAreaSelected(newCenter, selectedRadius);
    },
    [onAreaSelected, selectedRadius]
  );

  // Sync selectedCenter prop changes
  useEffect(() => {
    if (selectedCenter) {
      setCenter(selectedCenter);
    }
  }, [selectedCenter]);

  // Emit initial area on mount
  useEffect(() => {
    onAreaSelected(center, selectedRadius);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCenter = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCenter(newCenter);
        onAreaSelected(newCenter, selectedRadius);
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={10}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ minHeight: 360 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCircleController
          center={center}
          radiusKm={selectedRadius}
          onCenterChange={handleCenterChange}
        />
      </MapContainer>

      {/* Locate button */}
      <button
        onClick={handleLocate}
        disabled={geoLoading}
        className="absolute left-3 top-3 z-[1000] rounded-md bg-white px-2.5 py-2 text-xs font-medium text-ink-muted shadow-lg transition hover:bg-slate-50 hover:text-ink dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
        title="Gunakan lokasi saya"
      >
        <Crosshair className={`h-4 w-4 ${geoLoading ? "animate-spin" : ""}`} />
      </button>

      {/* Info overlay */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000]">
        <div className="rounded-lg bg-white/90 px-3 py-2 text-xs text-ink-muted shadow-lg backdrop-blur dark:bg-slate-900/90 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-brand-600 dark:text-brand-400" />
            <span>Klik peta untuk pindahkan pusat lingkaran</span>
          </div>
          <div className="mt-1 font-mono text-[10px] text-ink-subtle dark:text-slate-500">
            {center.lat.toFixed(4)}, {center.lng.toFixed(4)} — Radius: {selectedRadius} km
          </div>
          <div className="mt-0.5 text-[10px] text-ink-subtle dark:text-slate-500">
            Area: ~{((Math.PI * selectedRadius * selectedRadius)).toFixed(0)} km²
          </div>
        </div>
      </div>
    </div>
  );
}
