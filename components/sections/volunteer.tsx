"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  MapPin,
  Sparkles,
  Lock,
  ShieldCheck,
  Info,
  Eye,
  Wrench,
  Layers,
  TreePine,
  Sprout,
} from "lucide-react";
import {
  PROJECT_PROPOSAL_THRESHOLD,
  recentActivities as dummyActivities,
} from "@/lib/data";
import { getForm } from "@/lib/forms";
import { formatNumber } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { PointsGuideModal } from "@/components/sections/points-guide-modal";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return `${Math.floor(days / 7)} minggu lalu`;
}

type ActivityItem = {
  user: string;
  action: string;
  location: string;
  when: string;
  points: number;
  formSlug: string;
};

export function VolunteerActivities() {
  const { t } = useI18n();
  const [userPoints, setUserPoints] = useState(0);
  const [showPoints, setShowPoints] = useState(false);
  const [realActivities, setRealActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => {
        if (data.user) setUserPoints(data.user.points || 0);
      })
      .catch(() => {});
  }, []);

  // Fetch real activities from API, merge with dummy
  useEffect(() => {
    fetch("/api/reports?limit=10")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.reports?.length > 0) {
          const mapped: ActivityItem[] = data.reports.map((r: any) => ({
            user: r.user?.username || "Relawan",
            action: r.formSlug === "spring-monitoring" ? "melakukan pemantauan mata air"
                  : r.formSlug === "spring-restoration" ? "melakukan restorasi mata air"
                  : r.formSlug === "tree-planting" ? "menanam pohon endemik"
                  : r.formSlug === "trench-development" ? "membangun rorak"
                  : r.formSlug === "seedling-stock" ? "melaporkan stok bibit"
                  : `mengisi form ${r.formSlug}`,
            location: r.user?.region || "Indonesia",
            when: timeAgo(r.createdAt),
            points: r.formSlug === "spring-restoration" ? 100
                  : r.formSlug === "trench-development" ? 50
                  : r.formSlug === "tree-planting" ? 50
                  : r.formSlug === "seedling-stock" ? 15
                  : 25,
            formSlug: r.formSlug,
          }));
          // Merge: real data first, then dummy to fill slots
          setRealActivities(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const allActivities = [...realActivities, ...dummyActivities].slice(0, 10);
  const [actPage, setActPage] = useState(1);
  const actPerPage = 2;
  const totalActPages = Math.max(1, Math.ceil(allActivities.length / actPerPage));
  const visibleActs = allActivities.slice(
    (actPage - 1) * actPerPage,
    actPage * actPerPage
  );

  const eligible = userPoints >= PROJECT_PROPOSAL_THRESHOLD;
  const pct = Math.min(
    100,
    Math.round((userPoints / PROJECT_PROPOSAL_THRESHOLD) * 100)
  );

  return (
    <section id="community" className="container-page py-16">
      <h2 className="text-center text-3xl font-extrabold tracking-tight md:text-4xl">
        {t("volunteer.title")}{" "}
        <span className="text-brand-600">{t("volunteer.titleAccent")}</span>
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-ink-muted">
        {t("volunteer.description", {
          threshold: formatNumber(PROJECT_PROPOSAL_THRESHOLD),
        })}
      </p>

      <div className="mt-10 grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h3 className="text-sm font-semibold text-ink">
            {t("volunteer.recentActivities")}
          </h3>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {visibleActs.map((a: any, i) => {
              const form = getForm(a.formSlug);
              return (
                <li key={i} className="card">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-ink">{a.user}</div>
                      <div className="text-xs text-ink-muted">{a.action}</div>
                    </div>
                    <span className="chip bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                      <Sparkles className="h-3 w-3" />+{a.points} {t("volunteer.pts")}
                    </span>
                  </div>
                  <div className={`mt-3 flex h-32 items-center justify-center rounded-lg ${
                    a.formSlug?.includes("trench")
                      ? "bg-gradient-to-br from-amber-50 to-stone-100 dark:from-amber-900/30 dark:to-stone-900/50"
                      : a.formSlug?.includes("seedling")
                        ? "bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-900/50"
                        : "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/50"
                  }`}>
                    {a.formSlug?.includes("monitoring") && <Eye className="h-10 w-10 text-emerald-500" />}
                    {a.formSlug?.includes("restoration") && <Wrench className="h-10 w-10 text-amber-500" />}
                    {a.formSlug?.includes("trench") && <Layers className="h-10 w-10 text-amber-800" />}
                    {a.formSlug?.includes("tree") && <TreePine className="h-10 w-10 text-green-500" />}
                    {a.formSlug?.includes("seedling") && <Sprout className="h-10 w-10 text-emerald-600" />}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-ink-line pt-3 text-xs text-ink-muted dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      {a.location} · {a.when}
                    </div>
                    {form && (
                      <span className="chip bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {t("volunteer.form")} · {form.title}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {totalActPages > 1 && (
            <div className="mt-3 flex items-center justify-center gap-1">
              <button
                onClick={() => setActPage(p => Math.max(1, p - 1))}
                disabled={actPage === 1}
                className="rounded-md border border-ink-line px-2 py-1 text-xs font-medium text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                aria-label="Previous page"
              >
                ←
              </button>
              {Array.from({ length: totalActPages }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  onClick={() => setActPage(num)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    actPage === num
                      ? "bg-brand-600 text-white"
                      : "text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setActPage(p => p + 1)}
                disabled={actPage >= totalActPages}
                className="rounded-md border border-ink-line px-2 py-1 text-xs font-medium text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                aria-label="Next page"
              >
                →
              </button>
            </div>
          )}
        </div>

        <div className="card flex flex-col bg-gradient-to-br from-brand-50 to-white dark:from-brand-900/30 dark:to-slate-900 lg:col-span-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-ink">
              {t("volunteer.submitProject")}
            </h3>
            <span
              className={
                "chip " +
                (eligible
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300")
              }
            >
              {eligible
                ? t("volunteer.eligible")
                : t("volunteer.locked")}
            </span>
          </div>
          <h4 className="mt-1 text-lg font-bold text-brand-700">
            {t("volunteer.projectIdeaTitle")}
          </h4>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            {t("volunteer.projectIdeaDesc")}
          </p>

          {/* Eligibility progress */}
          <div className="mt-4 rounded-lg border border-ink-line/60 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-ink">
                {t("volunteer.yourPoints")}
              </span>
              <span className="text-ink-muted">
                {formatNumber(userPoints)} /{" "}
                {formatNumber(PROJECT_PROPOSAL_THRESHOLD)}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1 text-ink-muted">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                {t("volunteer.reviewNote")}
              </div>
              <button
                onClick={() => setShowPoints(true)}
                className="inline-flex cursor-pointer items-center gap-1 text-brand-600 hover:text-brand-700 font-medium"
              >
                <Info className="h-3 w-3" />
                Cara Dapat Poin
              </button>
            </div>
          </div>

          <div className="mt-5">
            {eligible ? (
              <Link href="/projects/new" className="btn-primary w-full">
                {t("volunteer.registerProject")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <button
                disabled
                className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-md bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-400"
              >
                <Lock className="h-4 w-4" />
                {t("volunteer.earnMore", {
                  points: formatNumber(
                    PROJECT_PROPOSAL_THRESHOLD - userPoints
                  ),
                })}
              </button>
            )}
          </div>
        </div>
      </div>

      <PointsGuideModal open={showPoints} onClose={() => setShowPoints(false)} />
    </section>
  );
}
