"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, TreePine, Droplets, Wrench, Sprout, Eye } from "lucide-react";

const formDisplay: Record<string, { icon: React.ReactNode; label: string; gradient: string; points: number }> = {
  "spring-monitoring": {
    icon: <Eye className="h-10 w-10 text-emerald-500" />,
    label: "Pemantauan Mata Air",
    gradient: "from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/50",
    points: 25,
  },
  "spring-restoration": {
    icon: <Wrench className="h-10 w-10 text-amber-500" />,
    label: "Restorasi Mata Air",
    gradient: "from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-900/50",
    points: 100,
  },
  "trench-development": {
    icon: <Droplets className="h-10 w-10 text-cyan-500" />,
    label: "Parit Resapan",
    gradient: "from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-900/50",
    points: 50,
  },
  "tree-planting": {
    icon: <TreePine className="h-10 w-10 text-green-500" />,
    label: "Tanam Pohon",
    gradient: "from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/50",
    points: 50,
  },
  "seedling-stock": {
    icon: <Sprout className="h-10 w-10 text-teal-500" />,
    label: "Stok Bibit",
    gradient: "from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-900/50",
    points: 15,
  },
};

type ActivityItem = {
  id: string;
  formSlug: string;
  username: string;
  region: string;
  createdAt: string;
  action: string;
};

export function ActivitiesCard() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetch("/api/gallery?limit=10")
      .then(r => r.json())
      .then(data => {
        const items = (data.gallery || []).map((g: { reportId: string; formSlug: string; username: string; region: string; createdAt: string }) => ({
          id: g.reportId,
          formSlug: g.formSlug,
          username: g.username,
          region: g.region,
          createdAt: g.createdAt,
          action: getActionLabel(g.formSlug),
        }));
        setActivities(items);
      })
      .catch(() => {});
  }, []);

  if (activities.length === 0) return null;

  const visible = activities.slice(0, 10);

  return (
    <div className="lg:col-span-7">
      <h3 className="text-sm font-semibold text-ink">Aktivitas Terbaru</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {visible.map((a) => {
          const f = formDisplay[a.formSlug] || formDisplay["spring-monitoring"];
          const timeAgo = getTimeAgo(a.createdAt);
          const region = a.region || "Indonesia";
          return (
            <div key={a.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-ink">{a.username || "Relawan"}</p>
                  <p className="text-xs text-ink-muted">{a.action}</p>
                </div>
                <span className="chip shrink-0 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                  <Sparkles className="mr-0.5 inline h-3 w-3" />
                  +{f.points} poin
                </span>
              </div>
              <div className={`mt-3 flex h-32 items-center justify-center rounded-lg bg-gradient-to-br ${f.gradient}`}>
                {f.icon}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-ink-muted">
                <span className="flex items-center gap-1">
                  <span>📍</span> {region}
                </span>
                <span>· {timeAgo}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getActionLabel(formSlug: string): string {
  const labels: Record<string, string> = {
    "spring-monitoring": "filed a Pemantauan Mata Air report",
    "spring-restoration": "melakukan restorasi mata air",
    "trench-development": "membangun parit resapan",
    "tree-planting": "logged tree planting",
    "seedling-stock": "menyiapkan stok bibit",
  };
  return labels[formSlug] || `melakukan ${formSlug.replace(/-/g, " ")}`;
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
