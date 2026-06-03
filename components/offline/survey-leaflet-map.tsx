"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { type OfflineTrackingPoint } from "@/lib/offline-db";

type SurveyLeafletMapProps = {
  trackingPoints: OfflineTrackingPoint[];
  springMarkers: OfflineTrackingPoint[];
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

/** Dark tile layer */
function MapLayers() {
  const map = useMap();

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    const tileUrl = isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const layer = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
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
  springMarkers,
  currentPosition,
  isTracking,
}: SurveyLeafletMapProps) {
  // Convert tracking points to Leaflet latlng tuples
  const trailPositions: [number, number][] = useMemo(
    () =>
      trackingPoints
        .filter((p) => !p.isSpringMarker)
        .map((p) => [p.lat, p.lng] as [number, number]),
    [trackingPoints]
  );

  const springPositions: [number, number][] = useMemo(
    () => springMarkers.map((p) => [p.lat, p.lng] as [number, number]),
    [springMarkers]
  );

  const initialCenter: [number, number] = currentPosition
    ? [currentPosition.lat, currentPosition.lng]
    : [-7.5, 110];

  return (
    <MapContainer
      center={initialCenter}
      zoom={15}
      scrollWheelZoom={true}
      className="h-full w-full"
      style={{ minHeight: "100%" }}
      zoomControl={false}
    >
      <MapLayers />
      <AutoFollow pos={currentPosition} isTracking={isTracking} />

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

      {/* Spring markers — amber/gold */}
      {springPositions.map((pos, i) => (
        <CircleMarker
          key={`spring-${i}`}
          center={pos}
          radius={10}
          pathOptions={{
            color: "#d97706",
            fillColor: "#f59e0b",
            fillOpacity: 0.8,
            weight: 3,
          }}
        >
          {/* Optional: add tooltip with spring name */}
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
