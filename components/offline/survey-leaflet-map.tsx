"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Circle, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { type OfflineTrackingPoint } from "@/lib/offline-db";

type SurveyLeafletMapProps = {
  trackingPoints: OfflineTrackingPoint[];
  markers: OfflineTrackingPoint[];
  currentPosition: { lat: number; lng: number } | null;
  isTracking: boolean;
};

/** Auto-follow GPS position */
function AutoFollow({ pos, isTracking }: { pos: { lat: number; lng: number } | null; isTracking: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (pos && isTracking) {
      map.panTo([pos.lat, pos.lng], { animate: true, duration: 0.5 });
    }
  }, [pos, isTracking, map]);

  return null;
}

/** Locate Me button — centers map on user's GPS position */
function LocateButton() {
  const map = useMap();

  const handleLocate = () => {
    if (!navigator.geolocation) {
      alert("GPS tidak didukung browser ini.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 15, {
          animate: true,
        });
      },
      () => {
        alert("Gagal mendapatkan lokasi. Pastikan GPS aktif.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="leaflet-top leaflet-left" style={{ marginTop: "10px", marginLeft: "10px" }}>
      <button
        onClick={handleLocate}
        className="flex h-9 w-9 items-center justify-center rounded-md bg-white shadow-md hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700"
        title="Lokasi Saya"
        aria-label="Lokasi Saya"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-600">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="3" />
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
        </svg>
      </button>
    </div>
  );
}

/** Dark-aware tile layer */
function MapLayers() {
  const map = useMap();

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    const tileUrl = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const layer = L.tileLayer(tileUrl, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    });

    map.addLayer(layer);

    layer.on("tileerror", (e) => {
      console.warn("[Map] Tile error:", e.error?.message || e.tile?.src);
    });

    return () => {
      map.removeLayer(layer);
    };
  }, [map]);

  return null;
}

export function SurveyLeafletMap({
  trackingPoints,
  markers,
  currentPosition,
  isTracking,
}: SurveyLeafletMapProps) {
  // GPS trail = markerType null (plain tracking points, not markers)
  const trailPositions: [number, number][] = useMemo(
    () =>
      trackingPoints
        .filter((p) => p.markerType === null)
        .map((p) => [p.lat, p.lng] as [number, number]),
    [trackingPoints]
  );

  // Filter markers by type
  const springMarkers = useMemo(() => markers.filter((p) => p.markerType === "spring"), [markers]);
  const treeMarkers = useMemo(() => markers.filter((p) => p.markerType === "tree"), [markers]);
  const trenchMarkers = useMemo(() => markers.filter((p) => p.markerType === "trench"), [markers]);

  const initialCenter: [number, number] = currentPosition
    ? [currentPosition.lat, currentPosition.lng]
    : [-7.5, 110];

  return (
    <MapContainer
      center={initialCenter}
      zoom={15}
      scrollWheelZoom={true}
      className="h-full w-full"
      style={{ minHeight: "400px", height: "100%", width: "100%" }}
      zoomControl={false}
    >
      <MapLayers />
      <AutoFollow pos={currentPosition} isTracking={isTracking} />
      <LocateButton />

      {/* GPS trail polyline — orange/red like Strava */}
      {trailPositions.length > 1 && (
        <Polyline
          positions={trailPositions}
          pathOptions={{
            color: "#f97316",
            weight: 4,
            opacity: 0.8,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      )}

      {/* 💧 Spring markers — blue */}
      {springMarkers.map((m) => (
        <CircleMarker
          key={m.id}
          center={[m.lat, m.lng]}
          radius={10}
          pathOptions={{
            color: "#2563eb",
            fillColor: "#3b82f6",
            fillOpacity: 0.8,
            weight: 3,
          }}
        >
          <Tooltip direction="top" offset={[0, -12]}>
            💧 {m.name || "Mata Air"}
          </Tooltip>
        </CircleMarker>
      ))}

      {/* 🌱 Tree markers — green */}
      {treeMarkers.map((m) => (
        <CircleMarker
          key={m.id}
          center={[m.lat, m.lng]}
          radius={10}
          pathOptions={{
            color: "#16a34a",
            fillColor: "#22c55e",
            fillOpacity: 0.8,
            weight: 3,
          }}
        >
          <Tooltip direction="top" offset={[0, -12]}>
            🌱 {m.name || "Tanam Pohon"}
          </Tooltip>
        </CircleMarker>
      ))}

      {/* 🕳️ Trench markers — orange */}
      {trenchMarkers.map((m) => (
        <CircleMarker
          key={m.id}
          center={[m.lat, m.lng]}
          radius={10}
          pathOptions={{
            color: "#ea580c",
            fillColor: "#f97316",
            fillOpacity: 0.8,
            weight: 3,
          }}
        >
          <Tooltip direction="top" offset={[0, -12]}>
            🕳️ {m.name || "Rorak"}
          </Tooltip>
        </CircleMarker>
      ))}

      {/* Current position indicator */}
      {currentPosition && (
        <>
          <Circle
            center={[currentPosition.lat, currentPosition.lng]}
            radius={5}
            pathOptions={{
              color: "#059669",
              fillColor: "#10b981",
              fillOpacity: 1,
              weight: 2,
            }}
          />
          <Circle
            center={[currentPosition.lat, currentPosition.lng]}
            radius={20}
            pathOptions={{
              color: "#059669",
              fillColor: "#10b981",
              fillOpacity: 0.15,
              weight: 1,
            }}
          />
        </>
      )}
    </MapContainer>
  );
}
