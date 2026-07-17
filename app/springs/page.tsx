"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Droplets, MapPin, Clock, ChevronRight, Loader2 } from "lucide-react";

type SpringItem = {
  id: string;
  name: string;
  province: string;
  regency: string;
  reportCount: number;
  updatedAt: string;
};

type SpringGroup = {
  snappedLat: number;
  snappedLng: number;
  totalSprings: number;
  totalReports: number;
  springs: SpringItem[];
  latestName: string;
  latestRegion: string;
  latestUpdate: string;
};

export default function SpringsListPage() {
  const [groups, setGroups] = useState<SpringGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/springs")
      .then(r => r.json())
      .then(data => setGroups(data.groups || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container-page flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
          Daftar Mata Air
        </h1>
        <p className="mt-2 text-ink-muted">
          {groups.reduce((s, g) => s + g.totalSprings, 0)} mata air terdata
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group, idx) => {
          const firstSpring = group.springs[0];
          const detailUrl = `/springs/${firstSpring.id}`;
          const region = group.latestRegion || firstSpring?.province || "Indonesia";
          const timeAgo = group.latestUpdate
            ? getTimeAgo(group.latestUpdate)
            : "Belum ada laporan";

          return (
            <Link
              key={idx}
              href={detailUrl}
              className="card group relative overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
                    <Droplets className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-ink">
                      {group.totalSprings > 1
                        ? group.springs.map(s => s.name).join(", ")
                        : firstSpring.name}
                    </h3>
                    <p className="truncate text-xs text-ink-muted">
                      <MapPin className="mr-0.5 inline h-3 w-3" />
                      {region}
                    </p>
                  </div>
                </div>
                <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-ink-subtle transition group-hover:translate-x-0.5" />
              </div>

              {/* Springs list if multiple */}
              {group.totalSprings > 1 && (
                <div className="mt-3 space-y-1 border-t border-ink-line/60 pt-3">
                  {group.springs.slice(0, 5).map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-xs">
                      <span className="truncate text-ink-muted">{s.name}</span>
                      <span className="shrink-0 text-ink-subtle">
                        {s.reportCount} laporan
                      </span>
                    </div>
                  ))}
                  {group.springs.length > 5 && (
                    <p className="text-xs text-ink-subtle">
                      +{group.springs.length - 5} lainnya
                    </p>
                  )}
                </div>
              )}

              {/* Footer stats */}
              <div className="mt-3 flex items-center justify-between border-t border-ink-line/60 pt-3 text-xs text-ink-muted">
                <span>
                  {group.totalReports} laporan
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {groups.length === 0 && (
        <div className="py-16 text-center text-sm text-ink-muted">
          Belum ada mata air terdata. Jadilah relawan pertama!
        </div>
      )}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  const months = Math.floor(days / 30);
  return `${months} bulan lalu`;
}
