"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type MapPointItem = {
  id: string;
  name: string;
  slug: string;
  snappedLat: number;
  snappedLng: number;
  type: { id: string; slug: string; name: string };
  category: { id: string; slug: string; name: string; color: string } | null;
  _count: { reports: number };
};

type FormItem = {
  id: string;
  slug: string;
  title: string;
  isActive: boolean;
  mapTypeId?: string | null;
  mapType?: { id: string; slug: string; name: string } | null;
};

function FitBounds({ points }: { points: MapPointItem[] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (points.length === 0 || fitted.current) return;
    const bounds = points.map((p) => [p.snappedLat, p.snappedLng] as [number, number]);
    map.fitBounds(bounds, { padding: [50, 50] });
    fitted.current = true;
  }, [points, map]);

  return null;
}

function getCategoryColor(point: MapPointItem): string {
  return point.category?.color || "#6b7280";
}

export default function AdminMapPreview({
  points,
  formsByType,
}: {
  points: MapPointItem[];
  formsByType: Map<string, FormItem[]>;
}) {
  const center = points.length > 0
    ? [
        points.reduce((s, p) => s + p.snappedLat, 0) / points.length,
        points.reduce((s, p) => s + p.snappedLng, 0) / points.length,
      ] as [number, number]
    : [-7.5, 110] as [number, number];

  return (
    <div className="h-full w-full">
      <MapContainer
        center={center}
        zoom={6}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ minHeight: 400 }}
        attributionControl={true}
      >
        <FitBounds points={points} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {points.map((p) => {
          const color = getCategoryColor(p);
          const linkedForms = p.type ? formsByType.get(p.type.id) || [] : [];
          return (
            <CircleMarker
              key={p.id}
              center={[p.snappedLat, p.snappedLng]}
              radius={10}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.8,
                weight: 3,
              }}
            >
              <Popup>
                <div className="min-w-[200px] text-sm">
                  <strong>{p.name}</strong>
                  <div className="mt-1 text-xs text-ink-muted">
                    {p.type?.name || "Tidak dikenal"}
                    {p.category ? ` · ${p.category.name}` : ""}
                  </div>
                  <div className="text-xs text-ink-subtle">
                    {p._count.reports} laporan terhubung
                  </div>
                  {linkedForms.length > 0 && (
                    <div className="mt-2 border-t border-ink-line/40 pt-2">
                      <div className="text-xs font-medium text-ink-muted mb-1">
                        Form terhubung:
                      </div>
                      {linkedForms.map((f) => (
                        <div key={f.id} className="flex items-center gap-1 text-xs">
                          <span className={`h-1.5 w-1.5 rounded-full ${f.isActive ? "bg-green-500" : "bg-slate-300"}`} />
                          {f.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {points.length === 0 && (
          <div className="flex h-full items-center justify-center bg-slate-50 text-sm text-ink-muted">
            Belum ada titik peta. Buat form atau tipe baru untuk memulai.
          </div>
        )}
      </MapContainer>
    </div>
  );
}
