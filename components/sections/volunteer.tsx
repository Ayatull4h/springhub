"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  MessageSquare,
  ThumbsUp,
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
  recentActivities,
} from "@/lib/data";
import { getForm } from "@/lib/forms";
import { formatNumber } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { PointsGuideModal } from "@/components/sections/points-guide-modal";



export function VolunteerActivities() {
  const { t } = useI18n();
  const [userPoints, setUserPoints] = useState(0);
  const [showPoints, setShowPoints] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => {
        if (data.user) setUserPoints(data.user.points || 0);
      })
      .catch(() => {});
  }, []);

  const [actPage, setActPage] = useState(1);
  const actPerPage = 2;
  const totalActPages = Math.max(1, Math.ceil(recentActivities.length / actPerPage));
  const visibleActs = recentActivities.slice(0, actPage * actPerPage);

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
            {visibleActs.map((a, i) => {
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
                  <div className="mt-3 flex h-32 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
                    {a.formSlug?.includes("monitoring") && <Eye className="h-10 w-10 text-emerald-500" />}
                    {a.formSlug?.includes("restoration") && <Wrench className="h-10 w-10 text-amber-500" />}
                    {a.formSlug?.includes("trench") && <Layers className="h-10 w-10 text-blue-500" />}
                    {a.formSlug?.includes("tree") && <TreePine className="h-10 w-10 text-green-500" />}
                    {a.formSlug?.includes("seedling") && <Sprout className="h-10 w-10 text-emerald-600" />}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
                    <MapPin className="h-3.5 w-3.5" />
                    {a.location} · {a.when}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-ink-line pt-3 text-xs text-ink-muted dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <button className="inline-flex items-center gap-1 hover:text-ink dark:hover:text-white">
                        <ThumbsUp className="h-3.5 w-3.5" /> 24
                      </button>
                      <button className="inline-flex items-center gap-1 hover:text-ink dark:hover:text-white">
                        <MessageSquare className="h-3.5 w-3.5" /> 6
                      </button>
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
          {recentActivities.length > actPerPage && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                onClick={() => setActPage(p => Math.max(1, p - 1))}
                disabled={actPage === 1}
                className="rounded-md border border-ink-line px-3 py-1 text-xs font-medium text-ink-muted hover:bg-slate-100 disabled:opacity-30"
              >
                ← Sebelumnya
              </button>
              <span className="text-xs text-ink-muted">
                Halaman {actPage} dari {totalActPages}
              </span>
              <button
                onClick={() => setActPage(p => p + 1)}
                disabled={actPage >= totalActPages}
                className="rounded-md border border-ink-line px-3 py-1 text-xs font-medium text-ink-muted hover:bg-slate-100 disabled:opacity-30"
              >
                Selanjutnya →
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
