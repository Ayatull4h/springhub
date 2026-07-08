"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, TreePine, Droplets, Wrench, Sprout } from "lucide-react";

const ITEMS_PER_PAGE = 2;
const POINTS_MAP: Record<string, number> = {
  "spring-monitoring": 25,
  "spring-restoration": 100,
  "trench-development": 50,
  "tree-planting": 50,
  "seedling-stock": 15,
};

const formIconsMap: Record<string, { icon: React.ReactNode; label: string; gradient: string }> = {
  "spring-monitoring": { icon: <Droplets className="h-10 w-10 text-blue-500" />, label: "Pemantauan Mata Air", gradient: "from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/50" },
  "spring-restoration": { icon: <Wrench className="h-10 w-10 text-amber-500" />, label: "Restorasi Mata Air", gradient: "from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-900/50" },
  "trench-development": { icon: <Droplets className="h-10 w-10 text-cyan-500" />, label: "Parit Resapan", gradient: "from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-900/50" },
  "tree-planting": { icon: <TreePine className="h-10 w-10 text-green-500" />, label: "Tanam Pohon", gradient: "from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/50" },
  "seedling-stock": { icon: <Sprout className="h-10 w-10 text-teal-500" />, label: "Stok Bibit", gradient: "from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-900/50" },
};

type ActivityItem = {
  id: string;
  formSlug: string;
  username: string;
  region: string;
  createdAt: string;
  photoUrl: string | null;
  springId: string | null;
};

export function ActivitiesCard() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/gallery?limit=20")
      .then(r => r.json())
      .then(data => {
        const items = (data.gallery || []).map((g: { reportId: string; formSlug: string; username: string; region: string; createdAt: string; photo: { url: string } | null }) => ({
          id: g.reportId,
          formSlug: g.formSlug,
          username: g.username,
          region: g.region,
          createdAt: g.createdAt,
          photoUrl: g.photo?.url || null,
          springId: null,
        }));
        setActivities(items);
      })
      .catch(() => {});
  }, []);

  const totalPages = Math.max(1, Math.ceil(activities.length / ITEMS_PER_PAGE));
  const visible = activities.slice(0, page * ITEMS_PER_PAGE);

  return (
    <div className="lg:col-span-7">
      <h3 className="text-sm font-semibold text-ink">Aktivitas Terbaru</h3>
      {activities.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">Belum ada aktivitas.</p>
      ) : (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {visible.map((a, i) => {
            const formInfo = formIconsMap[a.formSlug] || formIconsMap["spring-monitoring"];
            const pts = POINTS_MAP[a.formSlug] || 25;
            const timeAgo = getTimeAgo(a.createdAt);
            return (
              <Link
                key={a.id}
                href={a.springId ? `/springs/${a.springId}` : "#"}
                className="card group cursor-pointer transition hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{a.username}</p>
                    <p className="truncate text-xs text-ink-muted">{formInfo.label}</p>
                  </div>
                  <span className="chip shrink-0 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                    <Sparkles className="mr-0.5 inline h-3 w-3" />
                    +{pts} poin
                  </span>
                </div>
                <div className={`mt-3 flex h-32 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br ${formInfo.gradient}`}>
                  {a.photoUrl ? (
                    <Image
                      src={a.photoUrl}
                      alt=""
                      width={240}
                      height={128}
                      className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    formInfo.icon
                  )}
                </div>
                <p className="mt-2 text-xs text-ink-muted">
                  {a.region || "Indonesia"} · {timeAgo}
                </p>
              </Link>
            );
          })}
        </div>
      )}
      {activities.length > ITEMS_PER_PAGE && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md border border-ink-line px-3 py-1 text-xs font-medium text-ink-muted hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-700"
          >
            ←
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                page === i + 1
                  ? "bg-brand-600 text-white"
                  : "text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= totalPages}
            className="rounded-md border border-ink-line px-3 py-1 text-xs font-medium text-ink-muted hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-700"
          >
            →
          </button>
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
  return `${days} hari lalu`;
}
