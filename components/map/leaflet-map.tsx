"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, Circle, useMap } from "react-leaflet";
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
  slug?: string;
  snappedLat: number;
  snappedLng: number;
  reports: ReportData[];
  latestFormSlug: string;
  latestCreatedAt: string;
};

const formIconsToType: Record<string, string> = {
  "spring-monitoring": "spring",
  "spring-restoration": "spring",
  "tree-planting": "tanam-pohon",
  "trench-development": "trench",
  "seedling-stock": "seedling",
  "spring": "spring",
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
  const hasInteracted = useRef(false);
  const prevFingerprint = useRef<string>("");

  useEffect(() => {
    if (data.length === 0) return;

    const valid = data.filter(
      (r): r is (ReportData | SpringGroup) & { snappedLat: number; snappedLng: number } =>
        r.snappedLat !== null && r.snappedLng !== null
    );
    if (valid.length === 0) return;

    // Compute a fingerprint of marker IDs to detect when markers actually change
    // (filter toggle = new set of IDs, data re-fetch = same IDs)
    const fingerprint = valid
      .map((r) => ("id" in r ? r.id : "") + ("springId" in r ? r.springId ?? "" : ""))
      .sort()
      .join(",");

    // Same markers and user already dragged = skip (prevent snap-back on polling)
    if (fingerprint === prevFingerprint.current && hasInteracted.current) return;

    // Reset interaction flag on filter change so map refits
    if (fingerprint !== prevFingerprint.current) {
      hasInteracted.current = false;
    }
    prevFingerprint.current = fingerprint;

    // Calculate weighted center — markers with more reports get more weight
    let totalWeight = 0;
    let latSum = 0;
    let lngSum = 0;

    for (const item of valid) {
      const reportCount = "reports" in item ? item.reports.length : 1;
      const weight = Math.max(1, reportCount);
      latSum += item.snappedLat * weight;
      lngSum += item.snappedLng * weight;
      totalWeight += weight;
    }

    const centerLat = latSum / totalWeight;
    const centerLng = lngSum / totalWeight;

    // Fit bounds to show all markers
    const bounds = valid.map((r) => [r.snappedLat, r.snappedLng] as [number, number]);
    map.fitBounds(bounds, { padding: [50, 50] });

    // If bounds span across most of Indonesia, zoom in to the busiest area
    const bs = map.getBounds();
    const latDiff = bs.getNorth() - bs.getSouth();
    const lngDiff = bs.getEast() - bs.getWest();
    if (latDiff > 8 || lngDiff > 8) {
      map.setView([centerLat, centerLng], Math.max(6, Math.min(8, Math.round(12 - Math.max(latDiff, lngDiff) / 2))));
    }
  }, [data, map]);

  // Mark as interacted when user drags or zooms manually
  useEffect(() => {
    const onStart = () => { hasInteracted.current = true; };
    map.on("dragstart", onStart);
    map.on("zoomstart", onStart);
    return () => {
      map.off("dragstart", onStart);
      map.off("zoomstart", onStart);
    };
  }, [map]);

  return null;
}

function getMarkerColor(
  formSlug: string,
  formColors?: Record<string, { color: string; fillColor: string; label: string }>
): { color: string; fillColor: string; label: string } {
  if (formColors?.[formSlug]) return formColors[formSlug];
  const status = getStatusFromForm(formSlug);
  return statusColors[status] ?? statusColors.degraded;
}

export function LeafletMap({
  reports,
  formColors,
}: {
  reports: ReportData[];
  formColors?: Record<string, { color: string; fillColor: string; label: string }>;
}) {
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
      const name = springNames[id] || "Mata Air";
      groups.push({
        id,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || id,
        snappedLat: latest.snappedLat!,
        snappedLng: latest.snappedLng!,
        reports: list,
        latestFormSlug: latest.formSlug,
        latestCreatedAt: latest.createdAt,
      });
    }

    return { groups, noSpring };
  }, [reports, springNames]);

  // Fetch spring names for grouped markers — uses bulk API to avoid N+1 problem
  useEffect(() => {
    const ids = springs.groups
      .filter((g) => !springNames[g.id])
      .map((g) => g.id)
      .slice(0, 50);

    if (ids.length === 0) return;

    const fetchNames = async () => {
      try {
        const res = await fetch(`/api/springs/bulk?ids=${ids.join(",")}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.springs?.length) return;

        const results: Record<string, string> = {};
        for (const s of data.springs) {
          if (s.id && s.name) results[s.id] = s.name;
        }
        if (Object.keys(results).length > 0) {
          setSpringNames((prev) => ({ ...prev, ...results }));
        }
      } catch { /* ignore */ }
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
          const fc = getMarkerColor(sg.latestFormSlug, formColors);
          const actCount = sg.reports.length;
          const typeFromForm = formIconsToType[sg.latestFormSlug] || "spring";
          const detailUrl = `/${typeFromForm}/${sg.slug || sg.id}`;

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
                <Popup>
                  <div className="min-w-[200px] text-sm">
                    <strong className="text-base">{sg.name}</strong>
                    <div className="mt-1 text-xs text-ink-muted">
                      {actCount} laporan · terakhir{" "}
                      {new Date(sg.latestCreatedAt).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </div>
                    <div className="mt-2 space-y-1">
                      {sg.reports.slice(0, 10).map((r) => (
                        <div key={r.id} className="flex items-center gap-1 text-xs border-t border-ink-line/40 pt-1 first:border-t-0 first:pt-0">
                          <span>{formIcons[r.formSlug] || "📋"}</span>
                          <span className="capitalize text-ink-muted">{r.formSlug.replace(/-/g, " ")}</span>
                          {r.user?.username && <span className="text-ink-subtle">— {r.user.username}</span>}
                        </div>
                      ))}
                    </div>
                    <a
                      href={detailUrl}
                      className="mt-2 block rounded-md bg-brand-600 px-3 py-1.5 text-center text-xs font-semibold text-white hover:bg-brand-700"
                    >
                      Lihat Detail →
                    </a>
                  </div>
                </Popup>
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
          const fc = getMarkerColor(r.formSlug, formColors);
          const detailUrl = `/${formIconsToType[r.formSlug] || "spring"}/${r.id}`;
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
                <Popup>
                  <div className="min-w-[180px] text-sm">
                    <strong className="capitalize">{r.formSlug.replace(/-/g, " ")}</strong>
                    <div className="mt-1 text-xs text-ink-muted">
                      {new Date(r.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </div>
                    {r.user?.username && (
                      <div className="text-xs text-ink-muted">
                        oleh {r.user.username}{r.user?.region ? ` · ${r.user.region}` : ""}
                      </div>
                    )}
                    <a
                      href={detailUrl}
                      className="mt-2 block rounded-md bg-brand-600 px-3 py-1.5 text-center text-xs font-semibold text-white hover:bg-brand-700"
                    >
                      Lihat Detail →
                    </a>
                  </div>
                </Popup>
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
