"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, CircleMarker, Tooltip, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Status (condition) based colors for springs:
//   Biru (baik/healthy) → Kuning (sedang/restoration) → Merah (terdegradasi/degraded)
const statusColors: Record<string, { color: string; fillColor: string; label: string }> = {
  healthy: { color: "#2563eb", fillColor: "#3b82f6", label: "Sehat" },
  restoration: { color: "#d97706", fillColor: "#f59e0b", label: "Restorasi" },
  degraded: { color: "#dc2626", fillColor: "#ef4444", label: "Terdegradasi" },
};

// Map form slug to spring status
function getStatusFromForm(formSlug: string): string {
  switch (formSlug) {
    case "spring-monitoring":
    case "seedling-stock":
      return "healthy";
    case "spring-restoration":
    case "trench-development":
    case "tree-planting":
      return "restoration";
    default:
      return "degraded";
  }
}

type ReportData = {
  id: string;
  formSlug: string;
  snappedLat: number | null;
  snappedLng: number | null;
  springId: string | null;
  createdAt: string;
  user?: { username: string; region: string };
};

type SpringGroup = {
  id: string;
  name: string;
  snappedLat: number;
  snappedLng: number;
  reports: ReportData[];
  latestFormSlug: string;
  latestCreatedAt: string;
};

const formIcons: Record<string, string> = {
  "spring-monitoring": "🔵",
  "spring-restoration": "✨",
  "tree-planting": "🌱",
  "trench-development": "🕳️",
  "seedling-stock": "🌰",
};

function FitBounds({ data }: { data: (ReportData | SpringGroup)[] }) {
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
  const router = useRouter();
  const [tileError, setTileError] = useState(false);
  const [springNames, setSpringNames] = useState<Record<string, string>>({});

  // Group reports by springId → one marker per spring
  const springs = useMemo(() => {
    const map = new Map<string, ReportData[]>();
    const noSpring: ReportData[] = [];

    for (const r of reports) {
      if (r.springId && r.snappedLat && r.snappedLng) {
        const list = map.get(r.springId) || [];
        list.push(r);
        map.set(r.springId, list);
      } else if (r.snappedLat && r.snappedLng) {
        noSpring.push(r);
      }
    }

    const groups: SpringGroup[] = [];
    for (const [id, list] of map.entries()) {
      // Sort by date desc → latest first for status
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const latest = list[0];
      groups.push({
        id,
        name: springNames[id] || "Mata Air",
        snappedLat: latest.snappedLat!,
        snappedLng: latest.snappedLng!,
        reports: list,
        latestFormSlug: latest.formSlug,
        latestCreatedAt: latest.createdAt,
      });
    }

    return { groups, noSpring };
  }, [reports, springNames]);

  // Fetch spring names for grouped markers
  useEffect(() => {
    const ids = springs.groups
      .filter((g) => !springNames[g.id])
      .map((g) => g.id)
      .slice(0, 20);

    if (ids.length === 0) return;

    const fetchNames = async () => {
      const results: Record<string, string> = {};
      await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await fetch(`/api/springs/${id}`);
            const data = await res.json();
            if (data?.spring?.name) results[id] = data.spring.name;
          } catch { /* ignore */ }
        })
      );
      if (Object.keys(results).length > 0) {
        setSpringNames((prev) => ({ ...prev, ...results }));
      }
    };
    fetchNames();
  }, [springs.groups, springNames]);

  const markers: (ReportData | SpringGroup)[] = useMemo(
    () => [...springs.groups, ...springs.noSpring] as (ReportData | SpringGroup)[],
    [springs]
  );

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
        <FitBounds data={markers} />
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

        {/* ═══ Spring Group markers (one per spring) ═══ */}
        {springs.groups.map((sg) => {
          const status = getStatusFromForm(sg.latestFormSlug);
          const fc = statusColors[status] ?? statusColors.degraded;
          const actCount = sg.reports.length;

          // Larger radius for springs with more reports
          const radius = Math.min(12, 6 + actCount * 1.5);

          return (
            <Fragment key={`spring-${sg.id}`}>
              <CircleMarker
                center={[sg.snappedLat, sg.snappedLng]}
                radius={radius}
                pathOptions={{
                  color: fc.color,
                  fillColor: fc.fillColor,
                  fillOpacity: 0.8,
                  weight: 3,
                }}
                eventHandlers={{
                  click: () => router.push(`/springs/${sg.id}`),
                }}
              >
                <Tooltip direction="top" offset={[0, -8]}>
                  <div className="max-w-[180px] text-xs leading-relaxed">
                    <strong>{sg.name}</strong>
                    <br />
                    <span className="text-ink-muted">
                      {actCount} laporan · terakhir {new Date(sg.latestCreatedAt).toLocaleDateString("id-ID")}
                    </span>
                    <br />
                    <span className="text-ink-muted">
                      {sg.reports.map((r) => formIcons[r.formSlug] || "📋").join(" ")}
                    </span>
                    <br />
                    <span className="text-brand-600">Klik untuk detail</span>
                  </div>
                </Tooltip>
              </CircleMarker>
              <Circle
                center={[sg.snappedLat, sg.snappedLng]}
                radius={5000}
                pathOptions={{
                  color: fc.color,
                  fillColor: fc.color,
                  fillOpacity: 0.05,
                  weight: 1,
                  dashArray: "4 4",
                }}
              />
            </Fragment>
          );
        })}

        {/* ═══ Individual markers (no springId) — legacy fallback ═══ */}
        {springs.noSpring.map((r) => {
          const status = getStatusFromForm(r.formSlug);
          const fc = statusColors[status] ?? statusColors.degraded;
          return (
            <Fragment key={r.id}>
              <CircleMarker
                center={[r.snappedLat!, r.snappedLng!]}
                radius={8}
                pathOptions={{
                  color: fc.color,
                  fillColor: fc.fillColor,
                  fillOpacity: 0.7,
                  weight: 2,
                }}
              >
                <Tooltip direction="top" offset={[0, -8]}>
                  <div className="text-xs">
                    <strong>{fc.label}</strong>
                    <br />
                    <span className="text-ink-muted capitalize">
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
                center={[r.snappedLat!, r.snappedLng!]}
                radius={5000}
                pathOptions={{
                  color: fc.color,
                  fillColor: fc.color,
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
