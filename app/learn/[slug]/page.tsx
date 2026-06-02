"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  Layers,
  CheckCircle2,
  Circle,
  ArrowLeft,
  Award,
} from "lucide-react";

type Module = {
  id: string;
  title: string;
  content: string;
  sortOrder: number;
};

type Course = {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  icon: string;
  modules: Module[];
};

type Progress = {
  courseId: string;
  courseSlug: string;
  completedModules: number;
  totalModules: number;
  completed: boolean;
};

export default function LearnCoursePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ userId?: string } | null>(null);

  useEffect(() => {
    // Check auth
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});

    // Fetch course
    fetch(`/api/courses/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Course not found");
        return r.json();
      })
      .then((data) => setCourse(data.course))
      .catch(() => setError("Course not found"))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!user?.userId || !slug) return;
    fetch("/api/courses/progress")
      .then((r) => r.json())
      .then((data) => {
        const p = (data.progress ?? []).find(
          (x: Progress) => x.courseSlug === slug
        );
        if (p) setProgress(p);
      })
      .catch(() => {});
  }, [user, slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-900">
        <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-500" />
        <p className="text-sm text-ink-muted">{error || "Course not found"}</p>
        <Link
          href="/#learn"
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          Back to courses
        </Link>
      </div>
    );
  }

  const completedCount = progress?.completedModules ?? 0;
  const totalModules = course.modules.length;
  const isCompleted = progress?.completed ?? false;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="border-b border-ink-line bg-white dark:bg-slate-800">
        <div className="container-page py-4">
          <Link
            href="/#learn"
            className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Learning Hub
          </Link>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                  {course.level}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                  <Clock className="h-3.5 w-3.5" />
                  {course.duration}
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-bold text-ink">
                {course.title}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-ink-muted">
                {course.description}
              </p>
            </div>

            {isCompleted && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 dark:bg-emerald-900/30 dark:text-emerald-300">
                <Award className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">
                  Completed!
                </span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {totalModules > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                <div
                  className="rounded-full bg-brand-600 transition-all duration-500"
                  style={{
                    width: `${Math.round((completedCount / totalModules) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-xs text-ink-muted">
                {completedCount}/{totalModules} modules
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Module list */}
      <div className="container-page py-8">
        <div className="mx-auto max-w-2xl space-y-3">
          <h2 className="text-sm font-semibold text-ink">Course Modules</h2>

          {course.modules.length === 0 ? (
            <div className="card py-8 text-center">
              <Layers className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-500" />
              <p className="mt-2 text-sm text-ink-muted">
                No modules available yet
              </p>
            </div>
          ) : (
            course.modules.map((mod, index) => {
              const isCompletedModule = index < completedCount;
              const isCurrentModule = index === completedCount;
              return (
                <Link
                  key={mod.id}
                  href={`/learn/${slug}/${mod.id}`}
                  className={`card flex items-center gap-4 transition ${
                    isCurrentModule && !isCompleted
                      ? "border-brand-300 ring-1 ring-brand-200 dark:ring-brand-700"
                      : ""
                  } ${isCompletedModule ? "bg-emerald-50/50 dark:bg-emerald-900/20" : ""}`}
                >
                  <div className="flex-shrink-0">
                    {isCompletedModule ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-300 dark:text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-ink">
                      {mod.title || `Module ${index + 1}`}
                    </h3>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      Module {index + 1} of {totalModules}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-brand-600">
                    {isCompletedModule
                      ? "Review"
                      : isCurrentModule
                        ? "Start"
                        : "Locked"}
                  </span>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
