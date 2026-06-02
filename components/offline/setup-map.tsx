"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents, Rectangle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import L from "leaflet";

type SetupMapProps = {
  onAreaSelected: (bounds: { north: number; south: number; east: number; west: number }) => void;
  selectedArea: { north: number; south: number; east: number; west: number } | null;
};

/**
 * SetupMap — pilih area survei untuk tile pre-cache.
 * Area yang terlihat di viewport akan dipilih sebagai bounding box.
 */
function MapBoundsRecorder({ onBoundsChange }: { onBoundsChange: (bounds: { north: number; south: number; east: number; west: number }) => void }) {
  const map = useMap();

  const updateBounds = useCallback(() => {
    const b = map.getBounds();
    onBoundsChange({
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest(),
    });
  }, [map, onBoundsChange]);

  useMapEvents({
    moveend: updateBounds,
    zoomend: updateBounds,
  });

  useEffect(() => {
    // Set initial bounds after map loads
    setTimeout(updateBounds, 500);
  }, [updateBounds]);

  return null;
}

export function SetupMap({ onAreaSelected, selectedArea }: SetupMapProps) {
  const rectRef = useRef<L.Rectangle | null>(null);
  const [bounds, setBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);

  const handleBoundsChange = useCallback((b: { north: number; south: number; east: number; west: number }) => {
    setBounds(b);
    onAreaSelected(b);
  }, [onAreaSelected]);

  const areaBounds = selectedArea
    ? [
        [selectedArea.south, selectedArea.west],
        [selectedArea.north, selectedArea.east],
      ] as [[number, number], [number, number]]
    : null;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[-7.5, 110]}
        zoom={10}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ minHeight: 360 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBoundsRecorder onBoundsChange={handleBoundsChange} />

        {areaBounds && (
          <Rectangle
            bounds={areaBounds}
            pathOptions={{
              color: "#059669",
              weight: 2,
              fillColor: "#059669",
              fillOpacity: 0.1,
              dashArray: "8 4",
            }}
          />
        )}
      </MapContainer>

      {/* Info overlay */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000]">
        <div className="rounded-lg bg-white/90 px-3 py-2 text-xs text-ink-muted shadow-lg backdrop-blur dark:bg-slate-900/90 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-brand-600 dark:text-brand-400" />
            <span>Zoom/geser untuk pilih area survei</span>
          </div>
          {bounds && (
            <div className="mt-1 font-mono text-[10px] text-ink-subtle dark:text-slate-500">
              {bounds.south.toFixed(4)}, {bounds.west.toFixed(4)} — {bounds.north.toFixed(4)}, {bounds.east.toFixed(4)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
