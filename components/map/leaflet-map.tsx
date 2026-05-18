"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { springs, type SpringStatus } from "@/lib/data";
import { PROTECTION_RADIUS_KM } from "@/lib/geo";

const colors: Record<SpringStatus, string> = {
  healthy: "#10b981",
  degraded: "#ef4444",
  restoration: "#f59e0b",
};

export function LeafletMap({ filter }: { filter: SpringStatus | "all" }) {
  const visible = useMemo(
    () => (filter === "all" ? springs : springs.filter((s) => s.status === filter)),
    [filter]
  );

  return (
    <MapContainer
      center={[-7.5, 110]}
      zoom={6}
      scrollWheelZoom={true}
      className="h-full w-full"
      style={{ minHeight: 360 }}
      attributionControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {visible.map((s) => (
        <CircleMarker
          key={s.id}
          center={[s.publicLoc.lat, s.publicLoc.lng]}
          radius={8}
          pathOptions={{
            color: "#fff",
            weight: 2,
            fillColor: colors[s.status],
            fillOpacity: 1,
          }}
        >
          <Tooltip direction="top" offset={[0, -8]}>
            <div className="text-xs">
              <div className="font-semibold">{s.name}</div>
              <div className="text-slate-500">{s.region}</div>
              <div className="mt-0.5 text-[10px] text-slate-400">
                Snapped to {PROTECTION_RADIUS_KM} km grid
              </div>
            </div>
          </Tooltip>
          <Circle
            center={[s.publicLoc.lat, s.publicLoc.lng]}
            radius={PROTECTION_RADIUS_KM * 1000}
            pathOptions={{
              color: colors[s.status],
              weight: 1,
              fillColor: colors[s.status],
              fillOpacity: 0.08,
              dashArray: "4 4",
            }}
          />
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
