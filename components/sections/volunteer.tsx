"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
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
} from "@/lib/data";
import { getForm, POINTS_MAP } from "@/lib/forms";
import { formatNumber } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { PointsGuideModal } from "@/components/sections/points-guide-modal";
import { BKK_CARD_RADII, BkkTitleCloud } from "./bkk-decor";
import { BambooIcon } from "./eco-icons";
import { GrassTuft, Pebbles } from "./river-ornaments";

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
  photoUrl?: string | null;
};

export function VolunteerActivities() {
  const { t } = useI18n();
  const [userPoints, setUserPoints] = useState(0);
  const [showPoints, setShowPoints] = useState(false);
  const [realActivities, setRealActivities] = useState<ActivityItem[]>([]);

  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setUserPoints(data.user.points || 0);
          setUserRole(data.user.role || "");
        }
      })
      .catch(() => {});
  }, []);

  // Fetch real activities from API (max 10)
  useEffect(() => {
    fetch("/api/gallery?limit=10")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.gallery?.length > 0) {
          const mapped: ActivityItem[] = data.gallery.map((r: any) => {
            let action = "";
            let locationDetail = "";
            if (r.formSlug === "spring-monitoring" || r.formSlug === "spring-restoration") {
              action = r.detailName ? `memantau ${r.detailName}` : "memantau mata air";
              locationDetail = r.detailName || "";
            } else if (r.formSlug === "tree-planting") {
              action = r.detailName
                ? `menanam ${r.detailCount ? r.detailCount + " " : ""}${r.detailName}`
                : "menanam pohon";
              locationDetail = r.detailName || "";
            } else if (r.formSlug === "trench-development") {
              action = r.detailCount ? `membangun ${r.detailCount} rorak` : "membangun rorak";
              locationDetail = r.detailCount ? `${r.detailCount} rorak` : "";
            } else if (r.formSlug === "seedling-stock") {
              action = r.detailName
                ? `melaporkan ${r.detailCount ? r.detailCount + " " : ""}bibit ${r.detailName}`
                : "melaporkan stok bibit";
              locationDetail = r.detailName || "";
            } else {
              action = `mengisi form ${r.formSlug}`;
            }
            return {
              user: r.username || "Relawan",
              action,
              location: r.province || r.region || "Indonesia",
              when: timeAgo(r.createdAt),
              points: POINTS_MAP[r.formSlug] || 25,
              formSlug: r.formSlug,
              photoUrl: r.photo?.url || null,
            };
          });
          setRealActivities(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const allActivities = realActivities.slice(0, 10);
  const [actPage, setActPage] = useState(1);
  const actPerPage = 2;
  const totalActPages = Math.max(1, Math.ceil(allActivities.length / actPerPage));
  const visibleActs = allActivities.slice(
    (actPage - 1) * actPerPage,
    actPage * actPerPage
  );

  const eligible = userRole === "admin" || userRole === "field_lead";
  const pct = Math.min(
    100,
    Math.round((userPoints / PROJECT_PROPOSAL_THRESHOLD) * 100)
  );

  return (
    <section id="community" className="relative overflow-hidden bg-transparent pt-16 md:pt-20 dark:bg-transparent">
      <BambooIcon className="pointer-events-none absolute bottom-16 left-[3%] hidden w-28 opacity-80 lg:block" />
      <BambooIcon className="pointer-events-none absolute bottom-16 right-[3%] hidden w-28 opacity-80 lg:block" />
      <GrassTuft className="pointer-events-none absolute bottom-8 left-[2%] hidden w-20 opacity-90 lg:block" />
      <GrassTuft className="pointer-events-none absolute bottom-8 right-[2%] hidden w-20 opacity-90 lg:block" />
      <Pebbles className="pointer-events-none absolute bottom-10 left-[12%] hidden w-16 opacity-70 lg:block" />
      <div className="container-page relative z-10">
      <h2 className="font-display text-3xl font-bold tracking-tight text-sky-900 md:text-5xl dark:text-white">
        <BkkTitleCloud cloudClass="text-white dark:text-slate-800">{t("volunteer.title")}{" "}
        <span className="text-leaf-600">{t("volunteer.titleAccent")}</span></BkkTitleCloud>
      </h2>
      <p className="mt-3 max-w-2xl text-ink-muted">
        {t("volunteer.description", {
          threshold: formatNumber(PROJECT_PROPOSAL_THRESHOLD),
        })}
      </p>

      <div className="vol-grid mt-10 grid gap-4 lg:grid-cols-12">
        <div className="flex flex-col lg:col-span-7">
          <h3 className="text-sm font-semibold text-ink">
            {t("volunteer.recentActivities")}
          </h3>
          <div className="relative mt-3 flex-1 rounded-[6%_55%_6%_55%/50%_10%_50%_10%] bg-white p-10 pb-12 ring-4 ring-leaf-600/40 outline outline-4 outline-offset-[6px] outline-white/70 transition-transform hover:rotate-0 dark:bg-slate-900 dark:ring-slate-700 dark:outline-white/10 md:-rotate-[0.5deg] drop-shadow-[0_18px_28px_rgba(8,47,73,0.16)]">
            <ul className="grid gap-5 md:grid-cols-2">
            {visibleActs.map((a: any, i) => {
              const form = getForm(a.formSlug);
              return (
                <li key={i} className={`border border-ink-line/60 bg-white p-3 shadow-card transition-transform hover:rotate-0 hover:shadow-elevated dark:border-slate-700 dark:bg-slate-800 ${BKK_CARD_RADII[i % BKK_CARD_RADII.length]} ${i % 2 ? "md:rotate-2 md:translate-y-3" : "md:-rotate-2"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-ink">{a.user}</div>
                      <div className="text-xs text-ink-muted">{a.action}</div>
                    </div>
                    <span className="chip bg-tang-100 font-bold text-tang-700 dark:bg-sky-900/40 dark:text-sky-200">
                      <Sparkles className="h-3 w-3" />+{a.points} {t("volunteer.pts")}
                    </span>
                  </div>
                  <div className={`mt-3 flex h-32 items-center justify-center overflow-hidden rounded-[38%_62%_55%_45%/30%_28%_34%_32%] ${
                    a.formSlug?.includes("trench")
                      ? "bg-gradient-to-br from-amber-50 to-stone-100 dark:from-amber-900/30 dark:to-stone-900/50"
                      : a.formSlug?.includes("seedling")
                        ? "bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-900/50"
                        : "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-900/50"
                  }`}>
                    {a.photoUrl ? (
                      <Image src={a.photoUrl} alt="" width={240} height={128} className="h-full w-full object-cover" unoptimized />
                    ) : (
                      <>
                        {a.formSlug?.includes("monitoring") && <Eye className="h-10 w-10 text-emerald-500" />}
                        {a.formSlug?.includes("restoration") && <Wrench className="h-10 w-10 text-amber-500" />}
                        {a.formSlug?.includes("trench") && <Layers className="h-10 w-10 text-amber-800" />}
                        {a.formSlug?.includes("tree") && <TreePine className="h-10 w-10 text-green-500" />}
                        {a.formSlug?.includes("seedling") && <Sprout className="h-10 w-10 text-emerald-600" />}
                      </>
                    )}
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
                className="rounded-[55%_45%_60%_40%/60%_55%_45%_60%] border border-ink-line px-2 py-1 text-xs font-medium text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                aria-label="Previous page"
              >
                ←
              </button>
              {Array.from({ length: totalActPages }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  onClick={() => setActPage(num)}
                  className={`rounded-[55%_45%_60%_40%/60%_55%_45%_60%] px-2.5 py-1 text-xs font-medium transition ${
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
                className="rounded-[55%_45%_60%_40%/60%_55%_45%_60%] border border-ink-line px-2 py-1 text-xs font-medium text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
                aria-label="Next page"
              >
                →
              </button>
            </div>
          )}
          </div>
        </div>

        <div className="relative flex h-full flex-col rounded-[55%_6%_55%_6%/10%_50%_10%_50%] bg-gradient-to-br from-leaf-100 to-cream p-10 pb-12 ring-4 ring-leaf-600/40 outline outline-4 outline-offset-[6px] outline-white/70 transition-transform hover:rotate-0 dark:from-slate-800 dark:to-slate-900 dark:ring-slate-700 dark:outline-white/10 md:rotate-1 drop-shadow-[0_18px_28px_rgba(8,47,73,0.16)] lg:col-span-5">
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
          <div className="mt-4 rounded-[40%_60%_45%_55%/45%_55%_40%_60%] border border-ink-line/60 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
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
              <Link href="/projects/new" className="btn-primary w-full -rotate-1 shadow-[4px_4px_0_rgba(11,15,21,0.85)] transition hover:rotate-0">
                {t("volunteer.registerProject")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <button
                disabled
                className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-[60%_40%_55%_45%/55%_45%_60%_40%] bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 dark:bg-slate-700 dark:text-slate-400"
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
      </div>
    </section>
  );
}
