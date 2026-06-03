"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  ClipboardList,
  Sparkles,
  Droplets,
} from "lucide-react";
import { type SpringStatus } from "@/lib/data";
import { PROTECTION_RADIUS_KM } from "@/lib/geo";
import { FORMS, getForm } from "@/lib/forms";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { PointsGuideModal } from "@/components/sections/points-guide-modal";
import { StatusInfo } from "@/components/sections/status-info";

const LeafletMap = dynamic(
  () => import("@/components/map/leaflet-map").then((m) => m.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full w-full place-items-center bg-slate-50 text-sm text-ink-subtle dark:bg-slate-800 dark:text-slate-400">
        Loading OpenStreetMap…
      </div>
    ),
  }
);

const statusStyles: Record<SpringStatus, { dot: string; chip: string }> = {
  healthy: { dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  degraded: { dot: "bg-red-500", chip: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  restoration: { dot: "bg-amber-500", chip: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
};

function getStatusFromForm(formSlug: string): SpringStatus {
  switch (formSlug) {
    case "spring-monitoring":
      return "healthy";
    case "spring-restoration":
      return "restoration";
    case "trench-development":
    case "tree-planting":
      return "restoration";
    case "seedling-stock":
      return "healthy";
    default:
      return "degraded";
  }
}

function getLabelFromStatus(status: SpringStatus): string {
  switch (status) {
    case "healthy": return "Sehat";
    case "degraded": return "Terdegradasi";
    case "restoration": return "Restorasi";
  }
}

type ReportItem = {
  id: string;
  formSlug: string;
  snappedLat: number | null;
  snappedLng: number | null;
  createdAt: string;
  user?: { username: string; region: string };
};

export function SpringMap() {
  const { t } = useI18n();
  const [showMonitoring, setShowMonitoring] = useState(true);
  const [showTreePlanting, setShowTreePlanting] = useState(true);
  const [showSeedling, setShowSeedling] = useState(true);
  const [showTrench, setShowTrench] = useState(true);
  const [showRestoration, setShowRestoration] = useState(true);
  const [page, setPage] = useState(1);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [dynamicForms, setDynamicForms] = useState<any[]>([]);
  const [showGuide, setShowGuide] = useState(false);

  const fetchReports = () => {
    fetch("/api/reports?limit=50")
      .then((r) => r.json())
      .then((data) => setReports(data.reports || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/forms")
      .then(r => r.json())
      .then(data => setDynamicForms(data.forms || []))
      .catch(() => {});
  }, []);

  const visible = useMemo(
    () => reports.filter(r => {
      const slug = r.formSlug;
      if (slug.includes("monitoring") && !showMonitoring) return false;
      if (slug.includes("trench") && !showTrench) return false;
      if (slug.includes("tree") && !showTreePlanting) return false;
      if (slug.includes("seedling") && !showSeedling) return false;
      if (slug.includes("restoration") && !showRestoration) return false;
      return true;
    }),
    [reports, showMonitoring, showTrench, showTreePlanting, showSeedling, showRestoration]
  );
  const formTitles: Record<string, string> = {
    "spring-monitoring": "form.title.monitoring",
    "spring-restoration": "form.title.restoration",
    "trench-development": "form.title.trench",
    "tree-planting": "form.title.planting",
    "seedling-stock": "form.title.seedling",
  };

  const allForms = useMemo(() => {
    const staticForms = FORMS.map(f => ({
      slug: f.slug,
      title: f.title,
      pointsOnSubmit: f.pointsOnSubmit,
    }));
    const dbForms = dynamicForms.map((f: any) => ({
      slug: f.slug,
      title: f.title,
      pointsOnSubmit: f.pointsOnSubmit,
    }));
    const seen = new Set<string>();
    return [...staticForms, ...dbForms].filter(f => {
      if (seen.has(f.slug)) return false;
      seen.add(f.slug);
      return true;
    });
  }, [dynamicForms]);

  const itemsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(visible.length / itemsPerPage));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleList = visible.slice(startIndex, startIndex + itemsPerPage);

  return (
    <section id="map" className="container-page py-16">
      <h2 className="text-center text-3xl font-extrabold tracking-tight md:text-4xl">
        {t("map.title")}{" "}
        <span className="text-brand-600">{t("map.titleAccent")}</span>
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-ink-muted">
        {t("map.description")}
      </p>

      <div className="mx-auto mt-4 flex max-w-3xl items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" />
        <span
          dangerouslySetInnerHTML={{
            __html: t("map.protectionBanner", {
              radius: String(PROTECTION_RADIUS_KM),
            }),
          }}
        />
      </div>

      {/* Full-width map */}
      <div className="card mt-6 overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-line p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-ink">{t("map.show")}</span>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="checkbox" checked={showMonitoring} onChange={e => setShowMonitoring(e.target.checked)} className="h-3.5 w-3.5 rounded border-ink-line text-brand-600" />
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> {t("map.checkMonitoring")}
              </span>
            </label>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="checkbox" checked={showTreePlanting} onChange={e => setShowTreePlanting(e.target.checked)} className="h-3.5 w-3.5 rounded border-ink-line text-brand-600" />
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500" /> {t("map.checkTree")}
              </span>
            </label>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="checkbox" checked={showTrench} onChange={e => setShowTrench(e.target.checked)} className="h-3.5 w-3.5 rounded border-ink-line text-amber-800" />
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-800" /> Rorak
              </span>
            </label>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="checkbox" checked={showSeedling} onChange={e => setShowSeedling(e.target.checked)} className="h-3.5 w-3.5 rounded border-ink-line text-brand-600" />
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-sky-500" /> {t("map.checkSeedling")}
              </span>
            </label>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="checkbox" checked={showRestoration} onChange={e => setShowRestoration(e.target.checked)} className="h-3.5 w-3.5 rounded border-ink-line text-brand-600" />
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> {t("map.checkRestoration")}
              </span>
            </label>
          </div>
          <div className="flex items-center gap-3">
            <StatusInfo />
            <span className="text-[10px] uppercase tracking-wider text-ink-subtle">OpenStreetMap</span>
          </div>
        </div>
        <div className="aspect-[21/9] w-full md:aspect-[21/8]">
          <LeafletMap reports={visible} />
        </div>
      </div>

      {/* Below the map: report details (left) + Report Your Contribution (right) */}
      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <div className="card lg:col-span-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">
              {t("map.springDetails")}
            </h3>
            <span className="text-xs text-ink-subtle">
              {t("common.pageOf", { current: String(Math.min(currentPage * itemsPerPage, visible.length)), total: String(visible.length) })}
            </span>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {visibleList.map((r) => {
              const status = getStatusFromForm(r.formSlug);
              const styles = statusStyles[status];
              const statusLabel = getLabelFromStatus(status);
              return (
                <li
                  key={r.id}
                  className="flex items-start gap-3 rounded-lg border border-ink-line/60 p-3 dark:border-slate-700"
                >
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-900/50">
                    <Droplets className="h-5 w-5 text-brand-500" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-sm font-semibold text-ink">
                        {t(formTitles[r.formSlug] || r.formSlug.replace(/-/g, " "))}
                      </div>
                      <span className={cn("chip", styles.chip)}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="text-xs text-ink-muted">
                      {r.user?.region ?? t("map.unknownLocation")}
                    </div>
                    <div className="mt-1 text-xs text-ink-subtle">
                      {new Date(r.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {r.user?.username ?? "anonim"}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {visible.length > itemsPerPage && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => { setPage(p => Math.max(1, p - 1)); }}
                disabled={page === 1}
                className="rounded-md border border-ink-line px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
              >
                ← {t("common.previous")}
              </button>
              <span className="text-xs text-ink-muted">
                {t("common.pageOf", { current: String(Math.min(currentPage * itemsPerPage, visible.length)), total: String(visible.length) })}
              </span>
              <button
                onClick={() => { setPage(p => p + 1); }}
                disabled={currentPage * itemsPerPage >= visible.length}
                className="rounded-md border border-ink-line px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
              >
                {t("common.next")} →
              </button>
            </div>
          )}
        </div>

        <div className="card bg-gradient-to-br from-brand-50 to-white dark:from-brand-900/30 dark:to-slate-900 lg:col-span-6">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <ClipboardList className="h-4 w-4 text-brand-600" />
              {t("map.reportYourContribution")}
            </h3>
            <button
              type="button"
              onClick={() => setShowGuide(true)}
              className="chip bg-brand-50 text-brand-700 hover:bg-brand-100 cursor-pointer transition dark:bg-brand-900/30 dark:text-brand-300 dark:hover:bg-brand-800/50"
            >
              <Sparkles className="h-3 w-3" /> {t("map.earnPoints")}
            </button>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {t("map.reportDescription")}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {allForms.map((f) => (
              <Link
                key={f.slug}
                href={`/report/${f.slug}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-ink-line/60 bg-white px-3 py-2.5 text-sm transition hover:border-brand-300 cursor-pointer dark:border-slate-700 dark:bg-slate-800"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">
                    {t(formTitles[f.slug] || f.title)}
                  </span>
                  <span className="block truncate text-xs text-ink-muted">
                    {t("map.pointsOnSubmit", { pts: String(f.pointsOnSubmit) })}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 flex-none text-ink-subtle" />
              </Link>
            ))}
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-ink-line/60 bg-white px-3 py-2 text-xs text-ink-muted dark:border-slate-700 dark:bg-slate-800">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-none text-brand-600" />
            <span>
              {t("map.discoveryPrompt").includes("href=") ? (
                <span dangerouslySetInnerHTML={{ __html: t("map.discoveryPrompt") }} />
              ) : (
                <>
                  {t("map.discoveryPrompt")}{" "}
                  <Link href="/report/spring-monitoring" className="font-semibold text-brand-700 hover:underline">
                    {t("map.discoveryPrompt")}
                  </Link>
                </>
              )}
            </span>
          </div>
        </div>
      </div>
      <PointsGuideModal open={showGuide} onClose={() => setShowGuide(false)} />
    </section>
  );
}
