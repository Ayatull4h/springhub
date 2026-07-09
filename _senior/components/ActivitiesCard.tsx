"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Sparkles, Eye, TreePine, Droplets, Wrench, Sprout } from "lucide-react";

const formIcons: Record<string, { icon: React.ReactNode; gradient: string; label: string; points: number }> = {
  "spring-monitoring": {
    icon: <Eye className="h-10 w-10 text-emerald-500" />,
    gradient: "from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/50",
    label: "Spring Monitoring",
    points: 25,
  },
  "spring-restoration": {
    icon: <Wrench className="h-10 w-10 text-amber-500" />,
    gradient: "from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-900/50",
    label: "Spring Restoration",
    points: 100,
  },
  "trench-development": {
    icon: <Droplets className="h-10 w-10 text-cyan-500" />,
    gradient: "from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-900/50",
    label: "Trench Development",
    points: 50,
  },
  "tree-planting": {
    icon: <TreePine className="h-10 w-10 text-green-500" />,
    gradient: "from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/50",
    label: "Tree Planting",
    points: 50,
  },
  "seedling-stock": {
    icon: <Sprout className="h-10 w-10 text-teal-500" />,
    gradient: "from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-900/50",
    label: "Seedling Stock",
    points: 15,
  },
};

const ITEMS_PER_PAGE = 2;
const MAX_ITEMS = 10;

type GalleryItem = {
  id: string;
  formSlug: string;
  username: string;
  region: string;
  createdAt: string;
  photoUrl: string | null;
};

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ActivitiesCard() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/gallery?limit=10")
      .then(r => r.json())
      .then(data => {
        const gallery = (data.gallery || []).map((g: { reportId: string; formSlug: string; username: string; region: string; createdAt: string; photo: { url: string } | null }) => ({
          id: g.reportId,
          formSlug: g.formSlug,
          username: g.username,
          region: g.region,
          createdAt: g.createdAt,
          photoUrl: g.photo?.url || null,
        }));
        setItems(gallery.slice(0, MAX_ITEMS));
      })
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const start = (page - 1) * ITEMS_PER_PAGE;
  const visible = items.slice(start, start + ITEMS_PER_PAGE);

  return (
    <div className="lg:col-span-7">
      <h3 className="text-sm font-semibold text-ink">Recent Activities</h3>
      <ul className="mt-3 grid gap-3 md:grid-cols-2">
        {visible.map((a) => {
          const f = formIcons[a.formSlug] || formIcons["spring-monitoring"];
          const timeAgo = getTimeAgo(a.createdAt);
          const region = a.region || "Indonesia";
          return (
            <li key={a.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-ink">{a.username || "Relawan"}</div>
                  <div className="text-xs text-ink-muted">filed a {f.label} report</div>
                </div>
                <span className="chip shrink-0 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                  <Sparkles className="mr-0.5 inline h-3 w-3" />
                  +{f.points} pts
                </span>
              </div>
              <div className={`mt-3 flex h-32 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br ${f.gradient}`}>
                {a.photoUrl ? (
                  <Image
                    src={a.photoUrl}
                    alt=""
                    width={240}
                    height={128}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  f.icon
                )}
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-ink-line pt-3 text-xs text-ink-muted dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span>📍</span> {region} · {timeAgo}
                </div>
                <span className="chip bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Form · {f.label.split(" ")[0]}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      {items.length > ITEMS_PER_PAGE && (
        <div className="mt-3 flex items-center justify-center gap-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-md border border-ink-line px-2 py-1 text-xs font-medium text-ink-muted hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-700"
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
            className="rounded-md border border-ink-line px-2 py-1 text-xs font-medium text-ink-muted hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-700"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
