"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Clock, Layers, Sparkles, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

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

export function LearningHub() {
  const { t } = useI18n();
  const [courses, setCourses] = useState<CourseItem[]>([]);
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
    <section id="learn" className="container-page py-16">
      <h2 className="text-center text-3xl font-extrabold tracking-tight md:text-4xl">
        {t("learn.title")}{" "}
        <span className="text-brand-600">{t("learn.titleAccent")}</span>
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-ink-muted">
        {t("learn.description")}
      </p>

      {loading ? (
        <div className="mt-10 flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          <span className="ml-2 text-sm text-ink-muted">Loading courses...</span>
        </div>
      ) : courses.length === 0 ? (
        <div className="mt-10 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-2 text-sm text-ink-muted">No courses available yet</p>
        </div>
      ) : (
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => {
            const prog = getProgress(c.slug);
            return (
              <article key={c.id} className="card flex flex-col">
                <div className="aspect-[16/9] rounded-lg bg-gradient-to-br from-emerald-50 to-sky-50" />
                <span className="chip mt-4 self-start bg-brand-50 text-brand-700">
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
                    <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-100">
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
                  className="btn-secondary mt-5 inline-flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="h-4 w-4" />
                  {prog?.completed
                    ? "Review Course"
                    : prog
                      ? "Continue"
                      : t("learn.startCourse")}
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
