"use client";
import { Sparkles, Eye, TreePine, Droplets, Wrench, Sprout } from "lucide-react";
import { recentActivities } from "@/lib/data";

const formIcons: Record<string, { icon: React.ReactNode; gradient: string }> = {
  "spring-monitoring": {
    icon: <Eye className="h-10 w-10 text-emerald-500" />,
    gradient: "from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/50",
  },
  "spring-restoration": {
    icon: <Wrench className="h-10 w-10 text-amber-500" />,
    gradient: "from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-900/50",
  },
  "trench-development": {
    icon: <Droplets className="h-10 w-10 text-cyan-500" />,
    gradient: "from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-900/50",
  },
  "tree-planting": {
    icon: <TreePine className="h-10 w-10 text-green-500" />,
    gradient: "from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/50",
  },
  "seedling-stock": {
    icon: <Sprout className="h-10 w-10 text-teal-500" />,
    gradient: "from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-900/50",
  },
};

export function ActivitiesCard() {
  const visible = recentActivities.slice(0, 10);

  if (visible.length === 0) return null;

  return (
    <div className="lg:col-span-7">
      <h3 className="text-sm font-semibold text-ink">Aktivitas Terbaru</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {visible.map((a, i) => {
          const f = formIcons[a.formSlug] || formIcons["spring-monitoring"];
          return (
            <div key={i} className="card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-ink">{a.user}</p>
                  <p className="text-xs text-ink-muted">{a.action}</p>
                </div>
                <span className="chip shrink-0 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                  <Sparkles className="mr-0.5 inline h-3 w-3" />
                  +{a.points} poin
                </span>
              </div>
              <div className={`mt-3 flex h-32 items-center justify-center rounded-lg bg-gradient-to-br ${f.gradient}`}>
                {f.icon}
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                {a.location} · {a.when}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
