"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  MessageSquare,
  ThumbsUp,
  MapPin,
  Sparkles,
  Lock,
  ShieldCheck,
  Info,
} from "lucide-react";
import {
  PROJECT_PROPOSAL_THRESHOLD,
  currentUser,
  recentActivities,
} from "@/lib/data";
import { getForm } from "@/lib/forms";
import { formatNumber } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { PointsGuideModal } from "@/components/sections/points-guide-modal";

export function VolunteerActivities() {
  const { t } = useI18n();
  const [showPoints, setShowPoints] = useState(false);
  const eligible = currentUser.points >= PROJECT_PROPOSAL_THRESHOLD;
  const pct = Math.min(
    100,
    Math.round((currentUser.points / PROJECT_PROPOSAL_THRESHOLD) * 100)
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
            {recentActivities.map((a, i) => {
              const form = getForm(a.formSlug);
              return (
                <li key={i} className="card">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-ink">{a.user}</div>
                      <div className="text-xs text-ink-muted">{a.action}</div>
                    </div>
                    <span className="chip bg-brand-50 text-brand-700">
                      <Sparkles className="h-3 w-3" />+{a.points} {t("volunteer.pts")}
                    </span>
                  </div>
                  <div className="mt-3 aspect-[16/9] rounded-lg bg-gradient-to-br from-emerald-50 to-sky-50" />
                  <div className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
                    <MapPin className="h-3.5 w-3.5" />
                    {a.location} · {a.when}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-ink-line pt-3 text-xs text-ink-muted">
                    <div className="flex items-center gap-3">
                      <button className="inline-flex items-center gap-1 hover:text-ink">
                        <ThumbsUp className="h-3.5 w-3.5" /> 24
                      </button>
                      <button className="inline-flex items-center gap-1 hover:text-ink">
                        <MessageSquare className="h-3.5 w-3.5" /> 6
                      </button>
                    </div>
                    {form && (
                      <span className="chip bg-slate-100 text-slate-600">
                        {t("volunteer.form")} · {form.title}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="card flex flex-col bg-gradient-to-br from-brand-50 to-white lg:col-span-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-ink">
              {t("volunteer.submitProject")}
            </h3>
            <span
              className={
                "chip " +
                (eligible
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-600")
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
          <div className="mt-4 rounded-lg border border-ink-line/60 bg-white p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-ink">
                {t("volunteer.yourPoints")}
              </span>
              <span className="text-ink-muted">
                {formatNumber(currentUser.points)} /{" "}
                {formatNumber(PROJECT_PROPOSAL_THRESHOLD)}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
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
                className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium"
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
                className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-md bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500"
              >
                <Lock className="h-4 w-4" />
                {t("volunteer.earnMore", {
                  points: formatNumber(
                    PROJECT_PROPOSAL_THRESHOLD - currentUser.points
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
