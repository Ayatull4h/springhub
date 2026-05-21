"use client";

import { Fragment, useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { type SpringStatus } from "@/lib/data";

const statusColors: Record<SpringStatus, string> = {
  healthy: "#10b981",
  degraded: "#ef4444",
  restoration: "#f59e0b",
};

function getStatusFromForm(formSlug: string): SpringStatus {
  switch (formSlug) {
    case "spring-monitoring":
      return "healthy";
    case "spring-restoration":
      return "restoration";
    case "trench-development":
    case "tree-planting":
      return "restoration";
    case "seedling-stock":
      return "healthy";
    default:
      return "degraded";
  }
}

function getLabelFromStatus(status: SpringStatus): string {
  switch (status) {
    case "healthy": return "Sehat";
    case "degraded": return "Terdegradasi";
    case "restoration": return "Restorasi";
  }
}

type ReportData = {
  id: string;
  formSlug: string;
  snappedLat: number | null;
  snappedLng: number | null;
  createdAt: string;
  user?: { username: string; region: string };
};

function FitBounds({ data }: { data: ReportData[] }) {
  const map = useMap();
  useEffect(() => {
    if (data.length === 0) return;
    const valid = data.filter((r) => r.snappedLat && r.snappedLng);
    if (valid.length === 0) return;
    const bounds = valid.map((r) => [r.snappedLat!, r.snappedLng!] as [number, number]);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [data, map]);
  return null;
}

export function LeafletMap({ reports }: { reports: ReportData[] }) {
  const [tileError, setTileError] = useState(false);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[-7.5, 110]}
        zoom={6}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ minHeight: 360 }}
        attributionControl={true}
      >
        <FitBounds data={reports} />
        {tileError ? (
          <div className="flex h-full items-center justify-center bg-slate-100 text-sm text-ink-muted">
            Map tidak dapat dimuat. 
            <a href="https://www.openstreetmap.org" target="_blank" className="ml-1 text-brand-600">Buka di OpenStreetMap</a>
          </div>
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{
              tileerror: () => setTileError(true),
            }}
          />
        )}
        {reports.map((r) => {
            const status = getStatusFromForm(r.formSlug);
            const color = statusColors[status];
            if (!r.snappedLat || !r.snappedLng) return null;
            return (
              <Fragment key={r.id}>
                <CircleMarker
                  center={[r.snappedLat, r.snappedLng]}
                  radius={8}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.7,
                    weight: 2,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -8]}>
                    <div className="text-xs">
                      <strong>{getLabelFromStatus(status)}</strong>
                      <br />
                      <span className="text-ink-muted">
                        {r.formSlug.replace(/-/g, " ")}
                      </span>
                      {r.user?.username && (
                        <>
                          <br />
                          <span className="text-ink-muted">
                            oleh {r.user.username}
                          </span>
                        </>
                      )}
                    </div>
                  </Tooltip>
                </CircleMarker>
                <Circle
                  center={[r.snappedLat, r.snappedLng]}
                  radius={5000}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.05,
                    weight: 1,
                    dashArray: "4 4",
                  }}
                />
              </Fragment>
            );
          })}
      </MapContainer>

    </div>
  );
}
