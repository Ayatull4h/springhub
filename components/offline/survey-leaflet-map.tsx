"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Polyline, CircleMarker, Circle, Tooltip, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { type OfflineTrackingPoint, type MarkerType } from "@/lib/offline-db";
import { useI18n } from "@/lib/i18n";

// ── Custom divIcon untuk marker emoji ─────────────────────────────────────
const markerIcons: Record<MarkerType, L.DivIcon> = {
  spring: L.divIcon({
    className: "bg-transparent",
    html: `<div style="font-size:28px;line-height:1;text-align:center;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.3))">💧</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 28],
    tooltipAnchor: [0, -32],
  }),
  tree: L.divIcon({
    className: "bg-transparent",
    html: `<div style="font-size:28px;line-height:1;text-align:center;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.3))">🌱</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 28],
    tooltipAnchor: [0, -32],
  }),
  trench: L.divIcon({
    className: "bg-transparent",
    html: `<div style="font-size:28px;line-height:1;text-align:center;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.3))">🕳️</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 28],
    tooltipAnchor: [0, -32],
  }),
  seedling: L.divIcon({
    className: "bg-transparent",
    html: `<div style="font-size:28px;line-height:1;text-align:center;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.3))">🌰</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 28],
    tooltipAnchor: [0, -32],
  }),
};

type SurveyLeafletMapProps = {
  trackingPoints: OfflineTrackingPoint[];
  markers: OfflineTrackingPoint[];
  currentPosition: { lat: number; lng: number } | null;
  isTracking: boolean;
  initialCenter?: { lat: number; lng: number } | null;
  focusMarker?: { lat: number; lng: number } | null;
  autoFollowPaused?: boolean;
};

/** Auto-follow GPS position — paused after marker placement */
function AutoFollow({ pos, isTracking, paused }: { pos: { lat: number; lng: number } | null; isTracking: boolean; paused?: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (pos && isTracking && !paused) {
      map.panTo([pos.lat, pos.lng], { animate: true, duration: 0.5 });
    }
  }, [pos, isTracking, paused, map]);

  return null;
}

/** Locate Me button — centers map on user's GPS position */
function LocateButton() {
  const map = useMap();
  const { t } = useI18n();

  const handleLocate = () => {
    if (!navigator.geolocation) {
      alert(t("offline.gpsNotSupported") || "GPS tidak didukung browser ini.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 15, {
          animate: true,
        });
      },
      () => {
        alert(t("offline.gpsFailed") || "Gagal mendapatkan lokasi. Pastikan GPS aktif.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="leaflet-top leaflet-left" style={{ marginTop: "10px", marginLeft: "10px" }}>
      <button
        onClick={handleLocate}
        className="flex h-9 w-9 items-center justify-center rounded-md bg-white shadow-md hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700"
        title={t("offline.locateMe")}
        aria-label={t("offline.locateMe")}
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

/** Pan to a marker when focusMarker changes */
function FocusMarker({ marker }: { marker: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (marker) {
      map.flyTo([marker.lat, marker.lng], 15, { duration: 0.5 });
    }
  }, [marker, map]);
  return null;
}

/** OSM tile layer */
function MapLayers() {
  const map = useMap();

  useEffect(() => {
    const layer = L.tileLayer("https://a.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
    });

    layer.on("tileerror", (e) => {
      console.warn("[SurveyMap] Tile error:", e.error?.message || e.tile?.src);
    });

    map.addLayer(layer);

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
  initialCenter,
  focusMarker,
  autoFollowPaused = false,
}: SurveyLeafletMapProps) {
  const { t } = useI18n();
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
  const seedlingMarkers = useMemo(() => markers.filter((p) => p.markerType === "seedling"), [markers]);

  // Priority: initialCenter (from setup) > current GPS position > Java default
  const mapCenter: [number, number] = initialCenter
    ? [initialCenter.lat, initialCenter.lng]
    : currentPosition
      ? [currentPosition.lat, currentPosition.lng]
      : [-7.5, 110];

  return (
    <MapContainer
      center={mapCenter}
      zoom={15}
      scrollWheelZoom={true}
      className="h-full w-full"
      style={{ minHeight: "400px", height: "100%", width: "100%" }}
      zoomControl={false}
    >
      <MapLayers />
      <AutoFollow pos={currentPosition} isTracking={isTracking} paused={autoFollowPaused} />
      <FocusMarker marker={focusMarker ?? null} />
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

      {/* 💧 Spring markers — emoji */}
      {springMarkers.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={markerIcons.spring}
        >
          <Tooltip direction="top" offset={[0, -32]}>
            💧 {m.name || t("offline.springs")}
          </Tooltip>
        </Marker>
      ))}

      {/* 🌱 Tree markers — emoji */}
      {treeMarkers.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={markerIcons.tree}
        >
          <Tooltip direction="top" offset={[0, -32]}>
            🌱 {m.name || t("offline.trees")}
          </Tooltip>
        </Marker>
      ))}

      {/* 🕳️ Trench markers — emoji */}
      {trenchMarkers.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={markerIcons.trench}
        >
          <Tooltip direction="top" offset={[0, -32]}>
            🕳️ {m.name || t("offline.trenches")}
          </Tooltip>
        </Marker>
      ))}

      {/* 🌰 Seedling markers — emoji */}
      {seedlingMarkers.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={markerIcons.seedling}
        >
          <Tooltip direction="top" offset={[0, -32]}>
            🌰 {m.name || t("offline.seedlings")}
          </Tooltip>
        </Marker>
      ))}

      {/* Current position indicator — visible "You are here" */}
      {currentPosition && (
        <>
          {/* Outer pulse ring */}
          <Circle
            center={[currentPosition.lat, currentPosition.lng]}
            radius={25}
            pathOptions={{
              color: "#10b981",
              fillColor: "#10b981",
              fillOpacity: 0.1,
              weight: 1.5,
            }}
          />
          {/* Inner dot with border */}
          <CircleMarker
            center={[currentPosition.lat, currentPosition.lng]}
            radius={7}
            pathOptions={{
              color: "#047857",
              fillColor: "#34d399",
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Tooltip direction="top" permanent>
              <span className="text-xs font-bold">{t("offline.youAreHere") || "📍 Kamu"}</span>
            </Tooltip>
          </CircleMarker>
        </>
      )}
    </MapContainer>
  );
}
