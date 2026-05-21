"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, HardHat, Heart } from "lucide-react";
import { featuredProjects } from "@/lib/data";
import { formatNumber } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

const PROJECT_ICONS: Record<string, string> = {
  spring_restoration: "\uD83D\uDCA7",
  tree_planting: "\uD83C\uDF31",
  trench_development: "\uD83D\uDEE0\uFE0F",
  monitoring_expedition: "\uD83D\uDD2D",
};

export function FeaturedProjects() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);

  if (!featuredProjects.length) return null;

  const project = featuredProjects[page - 1] ?? featuredProjects[0];
  const pct = Math.min(100, Math.round((project.raised / project.goal) * 100));

  return (
    <div>
      <div className="mx-auto max-w-lg">
        <h2 className="text-center text-2xl font-extrabold md:text-3xl">
          {t("donate.featuredProjects")}
        </h2>
        <p className="mt-2 text-center text-sm text-ink-muted">
          "Every donation powers data-driven conservation. Help us bring these vital water sources back to life."
        </p>

        <div className="card mt-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
              {PROJECT_ICONS[project.typeId] || "\uD83D\uDCCB"} {project.typeId.replace(/_/g, " ")}
            </span>
            <span className={`ml-auto text-xs font-medium ${
              project.status === "approved" ? "text-emerald-600" : "text-amber-600"
            }`}>
              {project.status === "approved" ? "\u2705 Terverifikasi" : "\u23F3 Dalam Review"}
            </span>
          </div>

          <h3 className="text-lg font-bold text-ink">{project.title}</h3>
          <p className="mt-1 text-sm text-ink-muted">{project.summary}</p>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-ink">Rp {formatNumber(project.raised)}</span>
              <span className="text-ink-muted">/ Rp {formatNumber(project.goal)}</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-ink-muted">
              <span>{pct}% terkumpul</span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-rose-500" /> {project.backers} pendukung
              </span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1 text-xs text-ink-muted">
            <HardHat className="h-3 w-3" /> {project.region}
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            {featuredProjects.length > 1 && (
              <>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="rounded-md border border-ink-line px-3 py-1 text-xs disabled:opacity-30">
                  ←
                </button>
                <span className="text-xs text-ink-muted">{page}/{featuredProjects.length}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= featuredProjects.length}
                  className="rounded-md border border-ink-line px-3 py-1 text-xs disabled:opacity-30">
                  →
                </button>
              </>
            )}
          </div>

          <Link href={`mailto:info@jagasemesta.id?subject=Dukung ${encodeURIComponent(project.title)}`}
            className="btn-primary mt-4 w-full justify-center gap-2">
            <Heart className="h-4 w-4" /> {t("donate.supportProject")}
          </Link>

          {project.status !== "approved" && (
            <p className="mt-2 text-center text-xs text-ink-muted">
              ⏳ {t("donate.awaitingVerification")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
