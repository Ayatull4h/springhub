"use client";

import { Droplets, Sprout, Sparkles, Layers, TrendingUp } from "lucide-react";
import {
  impactStats,
  monthlyProgress,
  topRegions,
  topVolunteers,
} from "@/lib/data";
import { formatNumber } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { OfflineEntryButton } from "@/components/offline/offline-entry-button";

const iconMap: Record<string, typeof Droplets> = {
  droplet: Droplets,
  tree: Sprout,
  sparkles: Sparkles,
  layers: Layers,
};

export function ImpactDashboard() {
  const { t } = useI18n();

  const IconToStatKey: Record<string, string> = {
    droplet: "dashboard.stat.monitored",
    sparkles: "dashboard.stat.restored",
    tree: "dashboard.stat.trees",
    layers: "dashboard.stat.trenches",
  };

  const monthlyKeys = [
    "dashboard.monthly.springs",
    "dashboard.monthly.trees",
    "dashboard.monthly.volunteers",
  ];

  return (
    <section id="dashboard" className="container-page py-16">
      <h2 className="text-center text-3xl font-extrabold tracking-tight md:text-4xl">
        {t("dashboard.title")}{" "}
        <span className="text-brand-600">{t("dashboard.titleAccent")}</span>
      </h2>

      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {impactStats.map((s) => {
          const Icon = iconMap[s.icon] ?? Droplets;
          return (
            <div key={s.label} className="card">
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="chip bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                  <TrendingUp className="h-3 w-3" />
                  {(s.delta.match(/^[+-]?\d+/) ?? ["0"])[0]}
                </span>
              </div>
              <div className="mt-4 text-3xl font-bold tracking-tight">
                {s.display ?? formatNumber(s.value)}
              </div>
              <div className="mt-1 text-sm text-ink-muted">
                {t(IconToStatKey[s.icon])}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="card">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <TrendingUp className="h-4 w-4 text-brand-600" />
            {t("dashboard.monthly")}
          </h3>
          <ul className="mt-4 space-y-4">
            {monthlyProgress.map((p, idx) => {
              const pct = Math.min(100, Math.round((p.value / p.total) * 100));
              const suffix = p.suffix === "now" ? t("dashboard.monthly.now") : t("dashboard.monthly.joined");
              return (
                <li key={p.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink">{t(monthlyKeys[idx])}</span>
                    <span className="font-medium text-ink">
                      {p.value} {suffix}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-ink">{t("dashboard.regions")}</h3>
          <ol className="mt-4 space-y-3">
            {topRegions.map((r) => (
              <li
                key={r.rank}
                className="flex items-start gap-3 rounded-lg border border-ink-line/60 px-3 py-2.5 dark:border-slate-700"
              >
                <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                  {r.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink">{r.name}</div>
                  <div className="text-xs text-ink-muted">{r.detail}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-ink">{t("dashboard.volunteers")}</h3>
          <ol className="mt-4 space-y-3">
            {topVolunteers.map((v) => (
              <li
                key={v.rank}
                className="flex items-center gap-3 rounded-lg border border-ink-line/60 px-3 py-2.5 dark:border-slate-700"
              >
                <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                  {v.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink">{v.name}</div>
                  <div className="text-xs text-ink-muted">{v.region}</div>
                </div>
                <div className="text-sm font-bold text-brand-700">
                  {formatNumber(v.points)}
                  <span className="ml-1 text-[10px] font-medium text-ink-subtle">
                    {t("dashboard.volunteers.pts")}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Offline Entry Button */}
      <div className="mt-6 flex justify-end">
        <OfflineEntryButton />
      </div>
    </section>
  );
}
