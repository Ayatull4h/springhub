"use client";

import { useState, useEffect } from "react";
import { Droplets, Sprout, Sparkles, Layers, TrendingUp, Loader2 } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { DraftBanner } from "@/components/draft-banner";
import { BkkReveal, BkkCurve } from "./bkk-decor";

const STAT_COLORS = ["text-bkk-700", "text-bkkpink-600", "text-bkkblue-600", "text-emerald-600"];


const iconMap: Record<string, typeof Droplets> = {
  droplet: Droplets,
  tree: Sprout,
  sparkles: Sparkles,
  layers: Layers,
};

type ImpactStat = {
  label: string;
  value: number;
  display?: string;
  delta: string;
  icon: "droplet" | "sparkles" | "tree" | "layers";
  color: string;
};

type MonthlyProgress = {
  label: string;
  value: number;
  total: number;
  suffix: "now" | "joined";
};

type TopRegion = {
  rank: number;
  name: string;
  detail: string;
};

type TopVolunteer = {
  rank: number;
  name: string;
  region: string;
  points: number;
};

type DashboardData = {
  impactStats: ImpactStat[];
  monthlyProgress: MonthlyProgress[];
  topRegions: TopRegion[];
  topVolunteers: TopVolunteer[];
};

export function ImpactDashboard() {
  const { t } = useI18n();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthlyPage, setMonthlyPage] = useState(0);
  const monthlyPerPage = 5;

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalMonthlyPages = data ? Math.ceil(data.monthlyProgress.length / monthlyPerPage) : 0;
  const visibleMonthly = data
    ? data.monthlyProgress.slice(
        monthlyPage * monthlyPerPage,
        monthlyPage * monthlyPerPage + monthlyPerPage
      )
    : [];

  const IconToStatKey: Record<string, string> = {
    droplet: "dashboard.stat.monitored",
    sparkles: "dashboard.stat.restored",
    tree: "dashboard.stat.trees",
    layers: "dashboard.stat.trenches",
  };

  const monthlyKeys = [
    "dashboard.monthly.treePlanting",
    "dashboard.monthly.springMonitoring",
    "dashboard.monthly.springRestoration",
    "dashboard.monthly.rorak",
    "dashboard.monthly.seedlingStock",
    "dashboard.monthly.activeUsers",
    "dashboard.monthly.projectsSubmitted",
    "dashboard.monthly.coursesCompleted",
    "dashboard.monthly.totalDonations",
    "dashboard.monthly.protectedArea",
  ];

  return (
    <section id="dashboard" className="bg-bkk-700 pt-16 md:pt-20 dark:bg-bkk-900">
      <div className="container-page">
      <h2 className="text-center font-display text-3xl font-bold tracking-tight text-white md:text-5xl">
        {t("dashboard.title")}{" "}
        <span className="text-bkksun">{t("dashboard.titleAccent")}</span>
      </h2>

      {/* Draft banner */}
      <div className="mt-6">
        <DraftBanner />
      </div>

      {loading ? (
        <div className="mt-10 flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="mt-3 text-sm text-white/80">{t("common.loading")}</p>
        </div>
      ) : !data ? (
        <div className="mt-10 text-center text-white/80">
          <p>{t("dashboard.noData")}</p>
        </div>
      ) : (
        <>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {data.impactStats.map((s, si) => {
              const Icon = iconMap[s.icon] ?? Droplets;
              return (
                <BkkReveal key={s.label} delay={(si % 4) * 90}>
                <div className="rounded-3xl bg-white p-5 shadow-elevated dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-bkk-100 text-bkk-700 dark:bg-bkk-900/40 dark:text-bkk-200">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="chip bg-bkk-50 text-bkk-700 dark:bg-bkk-900/40 dark:text-bkk-200">
                      <TrendingUp className="h-3 w-3" aria-hidden="true" />
                      {(s.delta?.match(/^[+-]?\d+/) ?? ["0"])[0]}
                    </span>
                  </div>
                  <div className={`mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl dark:text-white ${STAT_COLORS[si % STAT_COLORS.length]}`}>
                    {s.display ?? formatNumber(s.value)}
                  </div>
                  <div className="mt-1 text-sm font-medium text-ink-muted">
                    {t(IconToStatKey[s.icon])}
                  </div>
                </div>
                </BkkReveal>
              );
            })}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-white p-6 shadow-elevated dark:bg-slate-900">
              <h3 className="flex items-center gap-2 font-display text-sm font-bold text-ink">
                <TrendingUp className="h-4 w-4 text-bkk-600" aria-hidden="true" />
                {t("dashboard.monthly")}
              </h3>
              <ul className="mt-4 space-y-4">
                {visibleMonthly.map((p, idx) => {
                  const globalIdx = monthlyPage * monthlyPerPage + idx;
                  const pct = Math.min(100, Math.round((p.value / p.total) * 100));
                  const suffix = p.suffix === "now" ? t("dashboard.monthly.now") : t("dashboard.monthly.joined");
                  return (
                    <li key={p.label}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-ink">{t(monthlyKeys[globalIdx])}</span>
                        <span className="font-medium text-ink">
                          {formatNumber(p.value)} {suffix}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-bkk-100 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full bg-bkk-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
              {totalMonthlyPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setMonthlyPage((p) => Math.max(0, p - 1))}
                    disabled={monthlyPage === 0}
                    className="rounded-md border border-ink-line px-3 py-1 text-xs font-medium text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                  >
                    ← {t("common.previous")}
                  </button>
                  <span className="text-xs text-ink-muted">
                    {monthlyPage + 1}/{totalMonthlyPages}
                  </span>
                  <button
                    onClick={() => setMonthlyPage((p) => Math.min(totalMonthlyPages - 1, p + 1))}
                    disabled={monthlyPage >= totalMonthlyPages - 1}
                    className="rounded-md border border-ink-line px-3 py-1 text-xs font-medium text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                  >
                    {t("common.next")} →
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-elevated dark:bg-slate-900">
              <h3 className="font-display text-sm font-bold text-ink">{t("dashboard.regions")}</h3>
              <ol className="mt-4 space-y-3">
                {data.topRegions.map((r) => (
                  <li
                    key={r.rank}
                    className="flex items-start gap-3 rounded-2xl border border-bkk-100 px-3 py-2.5 dark:border-slate-700"
                  >
                    <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-bkk-700 text-xs font-bold text-white">
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

            <div className="rounded-3xl bg-white p-6 shadow-elevated dark:bg-slate-900">
              <h3 className="font-display text-sm font-bold text-ink">{t("dashboard.volunteers")}</h3>
              <ol className="mt-4 space-y-3">
                {data.topVolunteers.map((v) => (
                  <li
                    key={v.rank}
                    className="flex items-center gap-3 rounded-2xl border border-bkk-100 px-3 py-2.5 dark:border-slate-700"
                  >
                    <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-bkk-700 text-xs font-bold text-white">
                      {v.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-ink">{v.name}</div>
                      <div className="text-xs text-ink-muted">{v.region}</div>
                    </div>
                    <div className="font-display text-sm font-bold text-bkk-700 dark:text-bkk-200">
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
        </>
      )}
      </div>
      <BkkCurve top="bg-transparent" bottom="text-white dark:text-slate-900" accent="text-bkkpink-500" />
    </section>
  );
}
