"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, useMap, useMapEvents, Circle, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Crosshair } from "lucide-react";
import L from "leaflet";
import { OfflineTileLayer } from "@/components/map/offline-tile-layer";

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
  const markerRef = useRef<L.Marker | null>(null);

  // Set initial view to center
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom());
  }, [map, center]);

  // Listen for map clicks to move circle center (when not dragging)
  useMapEvents({
    click(e) {
      onCenterChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  // Create circle + draggable marker
  useEffect(() => {
    // Remove old layers
    if (circleRef.current) map.removeLayer(circleRef.current);
    if (markerRef.current) map.removeLayer(markerRef.current);

    // Create circle
    const circle = L.circle([center.lat, center.lng], {
      radius: radiusKm * 1000,
      color: "#059673",
      weight: 2,
      fillColor: "#059673",
      fillOpacity: 0.1,
      dashArray: "8 4",
    }).addTo(map);
    circleRef.current = circle;

    // Create draggable custom marker at center (visible on all devices)
    const markerIcon = L.divIcon({
      html: '<div style="width:24px;height:24px;background:#059669;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:grab;"></div>',
      className: "", // remove default Leaflet classes
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    const marker = L.marker([center.lat, center.lng], {
      draggable: true,
      zIndexOffset: 1000,
      icon: markerIcon,
    }).addTo(map);
    markerRef.current = marker;

    // When marker is dragged, update circle position in real-time
    marker.on("drag", (e) => {
      const pos = e.target.getLatLng();
      circle.setLatLng(pos);
    });

    // When drag ends, finalize position
    marker.on("dragend", (e) => {
      const pos = e.target.getLatLng();
      onCenterChange({ lat: pos.lat, lng: pos.lng });
    });

    return () => {
      if (circleRef.current) map.removeLayer(circleRef.current);
      if (markerRef.current) map.removeLayer(markerRef.current);
    };
  }, [map, center.lat, center.lng, radiusKm, onCenterChange]);

  return null;
}

export function SetupMap({ onAreaSelected, selectedCenter, selectedRadius }: SetupMapProps) {
  const [center, setCenter] = useState<{ lat: number; lng: number }>(
    selectedCenter ?? { lat: -7.5, lng: 110 }
  );
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
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

  // Auto-locate on first load (only once)
  useEffect(() => {
    let cancelled = false;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        const newCenter = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCenter(newCenter);
        setUserPosition(newCenter);
        onAreaSelected(newCenter, selectedRadius);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    );
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCenter = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCenter(newCenter);
        setUserPosition(newCenter);
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
        zoomControl={true}
        className="h-full w-full"
        style={{ minHeight: 360 }}
      >
        <OfflineTileLayer />
        <MapCircleController
          center={center}
          radiusKm={selectedRadius}
          onCenterChange={handleCenterChange}
        />
        {/* User location marker */}
        {userPosition && (
          <CircleMarker
            center={[userPosition.lat, userPosition.lng]}
            radius={7}
            pathOptions={{
              color: "#047857",
              fillColor: "#34d399",
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Tooltip direction="top" permanent>
              <span className="text-xs font-bold">📍 Kamu</span>
            </Tooltip>
          </CircleMarker>
        )}
      </MapContainer>

      {/* Locate button */}
      <button
        onClick={handleLocate}
        disabled={geoLoading}
        className="absolute right-3 top-3 z-[1000] rounded-md bg-white px-2.5 py-2 text-xs font-medium text-ink-muted shadow-lg transition hover:bg-slate-50 hover:text-ink dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
        title="Gunakan lokasi saya"
      >
        <Crosshair className={`h-4 w-4 ${geoLoading ? "animate-spin" : ""}`} />
      </button>

      {/* Info overlay */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000]">
        <div className="rounded-lg bg-white/90 px-3 py-2 text-xs text-ink-muted shadow-lg backdrop-blur dark:bg-slate-900/90 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-brand-600 dark:text-brand-400" />
            <span>Seret marker ● untuk pindah posisi</span>
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
