"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Health-status based colors for springs:
const statusColors: Record<string, { color: string; fillColor: string; label: string }> = {
  sehat: { color: "#16a34a", fillColor: "#22c55e", label: "Sehat" },
  ringan: { color: "#ca8a04", fillColor: "#eab308", label: "Tercemar Ringan" },
  berat: { color: "#ea580c", fillColor: "#f97316", label: "Tercemar Berat" },
  kritis: { color: "#dc2626", fillColor: "#ef4444", label: "Kritis" },
};

// Map form slug to fallback status (used when no health data)
function getStatusFromForm(formSlug: string): string {
  switch (formSlug) {
    case "spring-monitoring":
      return "sehat";
    default:
      return "ringan";
  }
}

type ReportData = {
  id: string;
  formSlug: string;
  snappedLat: number | null;
  snappedLng: number | null;
  springId: string | null;
  createdAt: string;
  photoUrl?: string | null;
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
  springCount: number;
  healthStatus?: string;
};

const formIconsToType: Record<string, string> = {
  "spring-monitoring": "spring",
  "spring-restoration": "spring-restoration",
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
  formColors?: Record<string, { color: string; fillColor: string; label: string }>,
  healthStatus?: string
): { color: string; fillColor: string; label: string } {
  if (formColors?.[formSlug]) return formColors[formSlug];
  if (healthStatus && statusColors[healthStatus]) return statusColors[healthStatus];
  const status = getStatusFromForm(formSlug);
  return statusColors[status] ?? statusColors.kritis;
}

export function LeafletMap({
  reports,
  springs: springItems,
  formColors,
  formLookup,
}: {
  reports: ReportData[];
  springs?: { id: string; name: string; snappedLat: number; snappedLng: number; healthScore: number | null; healthStatus: string | null; reportCount: number }[];
  formColors?: Record<string, { color: string; fillColor: string; label: string }>;
  formLookup?: Record<string, { title: string; typeSlug: string }>;
}) {
  const router = useRouter();
  const [tileError, setTileError] = useState(false);
  const [springNames, setSpringNames] = useState<Record<string, string>>({});
  const [springHealth, setSpringHealth] = useState<Record<string, string>>({});
  const [activeLayer] = useState<"springs" | "activities">("activities");

  // Group reports by snapped location → one marker per grid (bisa banyak spring)
  const springGroups = useMemo(() => {
    const locMap = new Map<string, { reports: ReportData[]; springIds: Set<string>; springNames: Set<string> }>();
    const noSpring: ReportData[] = [];

    for (const r of reports) {
      if (r.springId && r.snappedLat && r.snappedLng) {
        const snapGrid = (n: number) => Math.round(n * 400) * 0.0025;
        const key = `${snapGrid(r.snappedLat).toFixed(4)}_${snapGrid(r.snappedLng).toFixed(4)}`;
        if (!locMap.has(key)) {
          locMap.set(key, { reports: [], springIds: new Set(), springNames: new Set() });
        }
        const entry = locMap.get(key)!;
        entry.reports.push(r);
        entry.springIds.add(r.springId);
        if (r.springId) {
          const name = springNames[r.springId];
          if (name) entry.springNames.add(name);
        }
      } else if (r.snappedLat && r.snappedLng) {
        noSpring.push(r);
      }
    }

    const groups: SpringGroup[] = [];
    for (const [, entry] of locMap.entries()) {
      entry.reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const latest = entry.reports[0];
      const names = Array.from(entry.springNames);
      const name = names.length > 0 ? names.join(", ") : `Mata Air (${entry.springIds.size} sumber)`;
      const firstId = Array.from(entry.springIds)[0] || "unknown";
      const healthStatus = entry.springIds.size === 1 ? springHealth[firstId] : undefined;
      groups.push({
        id: firstId,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || firstId,
        snappedLat: latest.snappedLat!,
        snappedLng: latest.snappedLng!,
        reports: entry.reports,
        latestFormSlug: latest.formSlug,
        latestCreatedAt: latest.createdAt,
        springCount: entry.springIds.size,
        healthStatus,
      });
    }

    return { groups, noSpring };
  }, [reports, springNames]);

  // Fetch spring names for grouped markers — uses bulk API to avoid N+1 problem
  useEffect(() => {
    const ids = springGroups.groups
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

        const names: Record<string, string> = {};
        const health: Record<string, string> = {};
        for (const s of data.springs) {
          if (s.id && s.name) names[s.id] = s.name;
          if (s.id && s.healthStatus) health[s.id] = s.healthStatus;
        }
        if (Object.keys(names).length > 0) setSpringNames((prev) => ({ ...prev, ...names }));
        if (Object.keys(health).length > 0) setSpringHealth((prev) => ({ ...prev, ...health }));
      } catch { /* ignore */ }
    };
    fetchNames();
  }, [springGroups.groups, springNames]);

  const markers: (ReportData | SpringGroup)[] = useMemo(
    () => [...springGroups.groups, ...springGroups.noSpring] as (ReportData | SpringGroup)[],
    [springGroups]
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

        {/* ═══ Spring markers (sumber daya) — hanya spring dengan health status ═══ */}
        {springItems?.filter((s: any) => s.healthStatus).map((s: any) => {
          const hc = statusColors[s.healthStatus || "sehat"] || statusColors.sehat;
          const r = 8;
          return (
            <Fragment key={`spring-${s.id}`}>
              <CircleMarker
                center={[s.snappedLat, s.snappedLng]}
                radius={r}
                pathOptions={{
                  color: hc.color,
                  fillColor: hc.fillColor,
                  fillOpacity: 0.8,
                  weight: 3,
                }}
              >
                <Tooltip direction="top" offset={[0, -8]}>
                  <div className="max-w-[180px] text-xs leading-relaxed">
                    <strong>{s.name}</strong>
                    <br />
                    <span className="font-medium" style={{ color: hc.color }}>{hc.label}</span>
                    {s.healthScore !== null && <span> · {s.healthScore}/100</span>}
                    <br />
                    <span className="text-ink-muted">{s.reportCount} laporan</span>
                    <br />
                    <span className="text-brand-600">Klik untuk detail</span>
                  </div>
                </Tooltip>
                <Popup>
                  <div className="min-w-[200px] text-sm">
                    <strong className="text-base">{s.name}</strong>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs" style={{ color: hc.color }}>●</span>
                      <span className="text-xs font-medium">{hc.label}</span>
                      {s.healthScore !== null && <span className="text-xs text-ink-muted">({s.healthScore}/100)</span>}
                    </div>
                    <div className="mt-1 text-xs text-ink-muted">{s.reportCount} laporan</div>
                    <a href={`/springs/${s.id}`} className="mt-2 block rounded-md bg-brand-600 px-3 py-1.5 text-center text-xs font-semibold text-white hover:bg-brand-700">Lihat Detail →</a>
                  </div>
                </Popup>
              </CircleMarker>
              <Circle center={[s.snappedLat, s.snappedLng]} radius={5000} pathOptions={{ color: hc.color, fillColor: hc.color, fillOpacity: 0.05, weight: 1, dashArray: "4 4" }} interactive={false} />
            </Fragment>
          );
        })}

        {/* ═══ Activity markers (laporan kegiatan) ═══ */}
        {springGroups.groups.map((sg) => {
          const fc = getMarkerColor(sg.latestFormSlug, formColors, sg.healthStatus);
          const actCount = sg.reports.length;
          const typeFromForm = formIconsToType[sg.latestFormSlug] || "spring";
          const detailUrl = sg.id && sg.id !== "unknown" ? `/springs/${sg.id}` : `/report/${sg.reports[0]?.id || sg.id}`;

                  const radius = 8;

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
                    {sg.healthStatus && (
                      <>
                        <br />
                        <span className="font-medium" style={{ color: fc.color }}>
                          {fc.label}
                        </span>
                      </>
                    )}

                    <br />
                    <span className="text-brand-600">Klik untuk detail</span>
                  </div>
                </Tooltip>
                <Popup>
                  <div className="min-w-[220px] text-sm">
                    <strong className="text-base">{sg.name}</strong>
                    <div className="mt-1 text-xs text-ink-muted">
                      {actCount} laporan{sg.springCount > 1 ? ` · ${sg.springCount} sumber` : ""} · terakhir{" "}
                      {new Date(sg.latestCreatedAt).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </div>
                    {/* Report count summary per form type */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Array.from(new Set(sg.reports.map(r => r.formSlug))).map(formSlug => {
                        const count = sg.reports.filter(r => r.formSlug === formSlug).length;
                        const formInfo = formLookup?.[formSlug];
                        return (
                          <span key={formSlug} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-ink-muted dark:bg-slate-700">
                            {formInfo?.title || formSlug.replace(/-/g, " ")}: {count}
                          </span>
                        );
                      })}
                    </div>
                    {sg.id && sg.id !== "unknown" && (
                      <a href={detailUrl} className="mt-2 block rounded-md bg-brand-600 px-3 py-1.5 text-center text-xs font-semibold text-white hover:bg-brand-700">
                        Lihat Detail →
                      </a>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
              {sg.healthStatus && (
              <Circle
                center={[sg.snappedLat, sg.snappedLng]}
                radius={5000}
                interactive={false}
                pathOptions={{
                  color: fc.color,
                  fillColor: fc.color,
                  fillOpacity: 0.05,
                  weight: 1,
                  dashArray: "4 4",
                  interactive: false,
                }}
              />
              )}
            </Fragment>
          );
        })}

        {/* ═══ Individual markers (no springId) — legacy fallback ═══ */}
        {springGroups.noSpring.map((r) => {
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
                    <strong>{formLookup?.[r.formSlug]?.title || r.formSlug.replace(/-/g, " ")}</strong>
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
            </Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}
