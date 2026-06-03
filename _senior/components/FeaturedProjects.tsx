"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, HardHat, Heart, ThumbsUp, MessageSquare } from "lucide-react";
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
  const [likedProjects, setLikedProjects] = useState<Record<number, boolean>>({});
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [currentComments, setCurrentComments] = useState(featuredProjects.map(p => p.comments));

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
          {t("donate.everyDonation")}
        </p>

        <div className="card mt-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
              {PROJECT_ICONS[project.typeId] || "\uD83D\uDCCB"} {t("projects.type." + project.typeId)}
            </span>
            <span className={`ml-auto text-xs font-medium ${
              project.status === "approved" ? "text-emerald-600" : "text-amber-600"
            }`}>
              {project.status === "approved" ? `\u2705 ${t("projects.verified")}` : `\u23F3 ${t("projects.underReview")}`}
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
              <span>{pct}% {t("projects.collected")}</span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-rose-500" /> {project.backers} {t("projects.supporters")}
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

          <div className="mt-4 flex items-center justify-between border-t border-ink-line pt-3 dark:border-slate-700">
            <button
              onClick={async () => {
                // Optimistic toggle
                setLikedProjects(prev => ({ ...prev, [page]: !prev[page] }));
                // Try to sync with API
                try {
                  await fetch(`/api/projects/${page}/like`, { method: "POST" });
                } catch {
                  // Revert on failure
                  setLikedProjects(prev => ({ ...prev, [page]: !prev[page] }));
                }
              }}
              className={`inline-flex items-center gap-1.5 text-xs transition ${
                likedProjects[page]
                  ? "text-brand-600"
                  : "text-ink-muted hover:text-ink dark:hover:text-white"
              }`}
            >
              <ThumbsUp className={`h-4 w-4 ${likedProjects[page] ? "fill-current" : ""}`} />
              {likedProjects[page] ? project.likes + 1 : project.likes}
            </button>
            <button
              onClick={() => setShowCommentInput(!showCommentInput)}
              className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink dark:hover:text-white"
            >
              <MessageSquare className="h-4 w-4" />
              {currentComments[page - 1]}
            </button>
          </div>

          {showCommentInput && (
            <div className="mt-3 border-t border-ink-line pt-3 dark:border-slate-700">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!commentText.trim()) return;
                  setCurrentComments(prev => {
                    const next = [...prev];
                    next[page - 1] = (next[page - 1] || 0) + 1;
                    return next;
                  });
                  setCommentText("");
                  setShowCommentInput(false);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Tulis komentar..."
                  className="flex-1 rounded-lg border border-ink-line px-3 py-1.5 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 dark:bg-slate-700"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  Kirim
                </button>
              </form>
            </div>
          )}

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
