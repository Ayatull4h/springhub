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

export function LeafletMap({ filter }: { filter: SpringStatus | "all" }) {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/reports?limit=100")
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        const data = await r.json();
        setReports(data.reports || []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="grid h-full w-full place-items-center text-sm text-ink-subtle">
        Loading data…
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid h-full w-full place-items-center bg-red-50 text-sm text-red-600">
        Map tidak dapat dimuat. Coba refresh halaman.
      </div>
    );
  }

  const filtered = filter === "all"
    ? reports
    : reports.filter((r) => getStatusFromForm(r.formSlug) === filter);

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
        <FitBounds data={filtered} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {filtered.map((r) => {
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

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] rounded-lg bg-white/90 p-3 shadow-md text-xs">
        <p className="mb-1.5 font-semibold text-ink">Status Mata Air</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-[#10b981]" />
            <span className="text-ink-muted">Sehat — terpantau baik</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-[#f59e0b]" />
            <span className="text-ink-muted">Restorasi — dalam pemulihan</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-[#ef4444]" />
            <span className="text-ink-muted">
              Terdegradasi — perlu intervensi
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
