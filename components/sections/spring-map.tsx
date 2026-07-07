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
  Loader2,
} from "lucide-react";
import { PROTECTION_RADIUS_KM } from "@/lib/geo";
import { FORMS, getForm } from "@/lib/forms";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { PointsGuideModal } from "@/components/sections/points-guide-modal";
import { StatusInfo } from "@/components/sections/status-info";
import { FloatingPointsButton } from "@/components/floating-points-button";
import { MapFilter } from "@/components/map/map-filter";

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

type CategoryItem = {
  id: string;
  slug: string;
  name: string;
  color: string;
};

function getStatusFromForm(formSlug: string, formTitle?: string): string {
  // Hardcoded untuk 5 form static
  const staticMap: Record<string, string> = {
    "spring-monitoring": "healthy",
    "spring-restoration": "restoration",
    "trench-development": "restoration",
    "tree-planting": "restoration",
    "seedling-stock": "healthy",
  };
  if (staticMap[formSlug]) return staticMap[formSlug];

  // Fallback: tebak dari title/description
  const lower = (formTitle || formSlug).toLowerCase();
  if (lower.includes("restorasi") || lower.includes("restoration") || lower.includes("tanam") || lower.includes("trench") || lower.includes("rorak")) {
    return "restoration";
  }
  if (lower.includes("monitoring") || lower.includes("pemantauan") || lower.includes("bibit") || lower.includes("seedling") || lower.includes("seed")) {
    return "healthy";
  }
  return "degraded";
}

function findCategoryForStatus(formSlug: string, status: string, categories: CategoryItem[]): CategoryItem | undefined {
  if (categories.length === 0) return undefined;
  const statusSlugMap: Record<string, string[]> = {
    healthy: ["sehat", "baik", "siap", "berfungsi"],
    degraded: ["terdegradasi", "rusak", "mati", "tersumbat"],
    restoration: ["restorasi", "baru", "tumbuh", "butuh"],
  };
  const keywords = statusSlugMap[status] || [];
  for (const kw of keywords) {
    const match = categories.find(c => c.slug.includes(kw));
    if (match) return match;
  }
  return categories[0];
}

type ReportItem = {
  id: string;
  formSlug: string;
  snappedLat: number | null;
  snappedLng: number | null;
  springId: string | null;
  createdAt: string;
  user?: { username: string; region: string };
};

export function SpringMap() {
  const { t } = useI18n();
  const [selectedType, setSelectedType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [page, setPage] = useState(1);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState("");
  const [dynamicForms, setDynamicForms] = useState<Array<{ slug: string; title: string; pointsOnSubmit: number }>>([]);
  const [formsError, setFormsError] = useState("");
  const [mapTypesWithCats, setMapTypesWithCats] = useState<Array<{ slug: string; id: string; name: string; categories: CategoryItem[] }>>([]);
  const [showGuide, setShowGuide] = useState(false);

  const fetchReports = () => {
    setReportsLoading(true);
    setReportsError("");
    fetch("/api/reports?limit=50")
      .then((r) => r.json())
      .then((data) => setReports(data.reports || []))
      .catch(() => setReportsError("Gagal memuat data laporan"))
      .finally(() => setReportsLoading(false));
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
      .catch(() => setFormsError("Gagal memuat daftar form"))
      .finally(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/map-points/types")
      .then(r => r.json())
      .then(data => setMapTypesWithCats(data.types || []))
      .catch(() => {});
  }, []);

  const formTitleI18nKey = (slug: string): string => {
    const map: Record<string, string> = {
      "spring-monitoring": "form.title.monitoring",
      "spring-restoration": "form.title.restoration",
      "trench-development": "form.title.trench",
      "tree-planting": "form.title.planting",
      "seedling-stock": "form.title.seedling",
    };
    return map[slug] || slug;
  };

  const allForms = useMemo(() => {
    const staticForms = FORMS.map(f => ({
      slug: f.slug,
      title: f.title,
      pointsOnSubmit: f.pointsOnSubmit,
    }));
    const dbForms = dynamicForms.map((f) => ({
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

  // Map form slug → its linked MapPointType's categories
  const formCategories = useMemo(() => {
    const map = new Map<string, CategoryItem[]>();
    for (const mt of mapTypesWithCats) {
      const formsWithType = allForms.filter(f => f.slug === mt.slug);
      for (const f of formsWithType) {
        map.set(f.slug, mt.categories);
      }
    }
    // Fallback: match form slugs to map type slugs
    if (mapTypesWithCats.length > 0) {
      const fallbacks: Record<string, string> = {
        "spring-monitoring": "spring",
        "spring-restoration": "spring",
        "trench-development": "trench",
        "tree-planting": "tree-planting",
        "seedling-stock": "seedling",
      };
      for (const [formSlug, typeSlug] of Object.entries(fallbacks)) {
        if (!map.has(formSlug)) {
          const mt = mapTypesWithCats.find(t => t.slug === typeSlug);
          if (mt) map.set(formSlug, mt.categories);
        }
      }
    }
    return map;
  }, [mapTypesWithCats, allForms]);

  // Count reports per form slug + category from DB
  const formCounts = useMemo(() => {
    const total: Record<string, number> = {};
    const byCat: Record<string, Record<string, number>> = {};
    for (const r of reports) {
      total[r.formSlug] = (total[r.formSlug] || 0) + 1;
      const cats = formCategories.get(r.formSlug) || [];
      const formTitle = t(formTitleI18nKey(r.formSlug));
      const status = getStatusFromForm(r.formSlug, formTitle);
      const matched = findCategoryForStatus(r.formSlug, status, cats);
      if (matched) {
        if (!byCat[r.formSlug]) byCat[r.formSlug] = {};
        byCat[r.formSlug][matched.slug] = (byCat[r.formSlug][matched.slug] || 0) + 1;
      }
    }
    return { total, byCategory: byCat };
  }, [reports, formCategories, t]);

  const formFilterOptions = useMemo(() => {
    return allForms
      .filter(f => (formCounts.total[f.slug] || 0) > 0)
      .map(f => {
        const sub: { value: string; label: string; color: string }[] = [];
        const cats = formCategories.get(f.slug) || [];
        for (const c of cats) {
          const count = formCounts.byCategory[f.slug]?.[c.slug] || 0;
          if (count > 0) {
            sub.push({
              value: `cat:${f.slug}:${c.slug}`,
              label: `${c.name} (${count})`,
              color: c.color,
            });
          }
        }
        return {
          value: f.slug,
          label: t(formTitleI18nKey(f.slug), f.title),
          count: formCounts.total[f.slug] || 0,
          subcategories: sub,
        };
      });
  }, [allForms, formCounts, formCategories, t]);

  // Build formColors lookup from map types/categories (data-driven, overrides hardcoded)
  const formColors = useMemo(() => {
    const colors: Record<string, { color: string; fillColor: string; label: string }> = {};
    for (const [formSlug, cats] of formCategories.entries()) {
      if (cats.length > 0) {
        const c = cats[0];
        colors[formSlug] = { color: c.color, fillColor: c.color, label: c.name };
      }
    }
    return colors;
  }, [formCategories]);

  // Filter reports by form slug + optional category slug
  const visible = useMemo(
    () => reports.filter(r => {
      if (!selectedType) return true;
      if (r.formSlug !== selectedType) return false;
      if (selectedCategory) {
        const cats = formCategories.get(r.formSlug) || [];
        const formTitle = t(formTitleI18nKey(r.formSlug));
        const status = getStatusFromForm(r.formSlug, formTitle);
        const matched = findCategoryForStatus(r.formSlug, status, cats);
        const catSlug = selectedCategory.replace(`cat:${selectedType}:`, "");
        return matched?.slug === catSlug;
      }
      return true;
    }),
    [reports, selectedType, selectedCategory, formCategories]
  );

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
      <div className="card mt-6 p-0 relative">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-line p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-ink">{t("map.show")}</span>
            <MapFilter
              selectedType={selectedType}
              selectedCategory={selectedCategory}
              onTypeChange={setSelectedType}
              onCategoryChange={setSelectedCategory}
              formOptions={formFilterOptions}
            />
          </div>
          <div className="flex items-center gap-3">
            <StatusInfo />
            <span className="text-[10px] uppercase tracking-wider text-ink-subtle">OpenStreetMap</span>
          </div>
        </div>
        <div className="aspect-[4/3] w-full md:aspect-[21/8] min-h-[360px]">
<LeafletMap reports={visible} formColors={formColors} />
        </div>
      </div>

      {/* Below the map: report details (left) + Report Your Contribution (right) */}
      <div className="mt-4 grid gap-4 lg:grid-cols-12">

        {reportsError && (
          <div className="lg:col-span-12 rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-300">
            {reportsError}. <button onClick={fetchReports} className="underline font-medium">Coba lagi</button>
          </div>
        )}

        {formsError && (
          <div className="lg:col-span-12 rounded-md bg-amber-50 dark:bg-amber-900/30 p-3 text-xs text-amber-700 dark:text-amber-300">
            {formsError}
          </div>
        )}

        <div className="card lg:col-span-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">
              {t("map.springDetails")}
            </h3>
            <span className="text-xs text-ink-subtle">
              {reportsLoading ? t("loading") : t("common.pageOf", { current: String(Math.min(currentPage * itemsPerPage, visible.length)), total: String(visible.length) })}
            </span>
          </div>
          {reportsLoading && visible.length === 0 ? (
            <div className="mt-3 flex items-center justify-center py-8 text-sm text-ink-muted">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("loading")}
            </div>
          ) : visible.length === 0 ? (
            <div className="mt-3 py-8 text-center text-sm text-ink-muted">{t("map.noReports")}</div>
          ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {visibleList.map((r) => {
              const cats = formCategories.get(r.formSlug) || [];
              const formTitle = t(formTitleI18nKey(r.formSlug));
              const status = getStatusFromForm(r.formSlug, formTitle);
              const matched = findCategoryForStatus(r.formSlug, status, cats);
              const chipColor = matched?.color || "#6b7280";
              const chipLabel = matched?.name || status.charAt(0).toUpperCase() + status.slice(1);
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
                        {t(formTitleI18nKey(r.formSlug), r.formSlug.replace(/-/g, " "))}
                      </div>
                      <span className="chip" style={{ backgroundColor: chipColor + "20", color: chipColor, borderColor: chipColor + "40" }}>
                        {chipLabel}
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
                      · {r.user?.username ?? t("common.anonymous")}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          )}
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
                    {t(formTitleI18nKey(f.slug), f.title)}
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
      <FloatingPointsButton />
    </section>
  );
}
