"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Clock, Layers, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { BkkTitleCloud, BkkCloudBox } from "./bkk-decor";
import { BanyanIcon } from "./eco-icons";
import { HangingRoots, Pebbles } from "./river-ornaments";

type CourseItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  icon: string;
  modules: { id: string; title: string; sortOrder: number }[];
};

type ProgressItem = {
  courseSlug: string;
  completedModules: number;
  totalModules: number;
  completed: boolean;
};



const CLOUD_TILTS = ["md:-rotate-1", "md:rotate-1", "md:-rotate-2"];
const THUMB_VARIANTS = [
  "rounded-[45%_55%_50%_50%/42%_44%_36%_40%] bg-gradient-to-br from-tang-100 to-cream dark:from-amber-900/30 dark:to-amber-900/50",
  "rounded-[55%_45%_52%_48%/38%_42%_44%_36%] bg-gradient-to-br from-sky-100 to-white dark:from-sky-900/30 dark:to-sky-900/50",
  "rounded-[50%_50%_48%_52%/44%_38%_42%_46%] bg-gradient-to-br from-leaf-100 to-cream dark:from-emerald-900/30 dark:to-emerald-900/50",
];
const THUMB_ICONS = ["text-tang-600", "text-sky-600", "text-leaf-700"];
const CHIP_TILTS = ["-rotate-2", "rotate-2", "-rotate-1"];
const BTN_VARIANTS = [
  "rounded-[60%_40%_55%_45%/55%_45%_60%_40%] bg-sky-800 shadow-[3px_3px_0_rgba(8,47,73,0.9)] -rotate-1",
  "rounded-[40%_60%_45%_55%/45%_55%_40%_60%] bg-emerald-800 shadow-[3px_3px_0_rgba(6,78,59,0.9)] rotate-1",
  "rounded-[55%_45%_60%_40%/50%_55%_45%_50%] bg-amber-800 shadow-[3px_3px_0_rgba(120,53,15,0.9)] -rotate-2",
];

export function LearningHub() {
  const { t } = useI18n();const [courses, setCourses] = useState<CourseItem[]>([]);
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ userId?: string } | null>(null);

  useEffect(() => {
    // Check auth
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});

    // Fetch courses
    fetch("/api/courses")
      .then((r) => r.json())
      .then((data) => setCourses(data.courses ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user?.userId) return;
    fetch("/api/courses/progress")
      .then((r) => r.json())
      .then((data) => setProgress(data.progress ?? []))
      .catch(() => {});
  }, [user]);

  function getProgress(slug: string): ProgressItem | undefined {
    return progress.find((p) => p.courseSlug === slug);
  }

  return (
    <section id="learn" className="relative overflow-x-clip bg-transparent pt-16 md:pt-20 dark:bg-transparent">
      <BanyanIcon className="pointer-events-none absolute -top-2 right-[4%] hidden w-56 opacity-90 lg:block" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-leaf-100/60 blur-3xl dark:bg-leaf-700/20" />
      <HangingRoots className="pointer-events-none absolute left-[8%] top-0 hidden w-24 opacity-80 lg:block" />
      <Pebbles className="pointer-events-none absolute bottom-16 left-[3%] hidden w-20 opacity-70 lg:block" />
      <div className="container-page relative">
      <h2 className="font-display text-3xl font-bold tracking-tight text-sky-900 md:text-5xl dark:text-white">
        <BkkTitleCloud cloudClass="text-leaf-100 dark:text-slate-800">{t("learn.title")}{" "}
        <span className="text-leaf-600">{t("learn.titleAccent")}</span></BkkTitleCloud>
      </h2>
      <p className="mt-3 max-w-2xl text-ink-muted">
        {t("learn.description")}
      </p>

      {loading ? (
        <div className="mt-10 flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          <span className="ml-2 text-sm text-ink-muted">Loading courses...</span>
        </div>
      ) : courses.length === 0 ? (
        <div className="mt-10 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="mt-2 text-sm text-ink-muted">No courses available yet</p>
        </div>
      ) : (
        <div className="river-cards mt-10 grid gap-5 md:grid-cols-2 md:gap-7 lg:grid-cols-3">
          {courses.map((c, ci) => {
            const prog = getProgress(c.slug);
            const vi = ci % 3;
            return (
              <div key={c.id} className={`transition-transform hover:rotate-0 ${CLOUD_TILTS[vi]}`}>
              <BkkCloudBox className="flex h-full flex-col bg-gradient-to-b from-[#FFFDF6] to-[#FFF3D6] p-6 pb-8 dark:from-slate-900 dark:to-slate-900 drop-shadow-[0_18px_28px_rgba(8,47,73,0.16)]" flip={ci % 2 === 0} tall>
                <div className={`-mx-6 -mt-6 mb-3 flex h-32 items-center justify-center overflow-hidden ${THUMB_VARIANTS[vi]}`}>
                  <BookOpen className={`h-12 w-12 ${THUMB_ICONS[vi]}`} />
                </div>
                <span className={`chip mt-4 self-start bg-bkk-100 font-bold text-bkk-700 dark:bg-bkk-900/30 dark:text-bkk-200 ${CHIP_TILTS[vi]}`}>
                  {c.level}
                </span>
                <h3 className="mt-2 text-base font-semibold text-ink">
                  {c.title}
                </h3>
                <p className="mt-1 text-sm text-ink-muted line-clamp-2">
                  {c.description}
                </p>

                <div className="mt-4 flex items-center gap-4 text-xs text-ink-muted">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {c.duration}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    {t("learn.modules", { count: String(c.modules.length) })}
                  </span>
                </div>

                {/* Progress indicator */}
                {prog && (
                  <div className="mt-3">
                    <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                      <div
                        className="rounded-full bg-brand-600 transition-all"
                        style={{
                          width: `${Math.round(
                            (prog.completedModules / prog.totalModules) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-ink-subtle">
                      {prog.completedModules}/{prog.totalModules} completed
                      {prog.completed && (
                        <span className="ml-1 text-emerald-600">✓</span>
                      )}
                    </p>
                  </div>
                )}

                <Link
                  href={`/learn/${c.slug}`}
                  className={`mt-5 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 font-display text-sm font-bold text-white ring-2 ring-white/60 transition hover:rotate-0 hover:scale-[1.02] ${BTN_VARIANTS[vi]}`}
                >
                  <BookOpen className="h-4 w-4" />
                  {prog?.completed
                    ? "Review Course"
                    : prog
                      ? "Continue"
                      : t("learn.startCourse")}
                </Link>
              </BkkCloudBox>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </section>
  );
}
