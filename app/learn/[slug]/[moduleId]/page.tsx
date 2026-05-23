"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  ArrowLeft,
  ArrowRight,
  Award,
  Sparkles,
  Loader2,
  AlertCircle,
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
  modules: Module[];
};

export default function LearnModulePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const moduleId = params.moduleId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [progress, setProgress] = useState<{
    completedModules: number;
    totalModules: number;
    completed: boolean;
  } | null>(null);
  const [user, setUser] = useState<{ userId?: string } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userMessage, setUserMessage] = useState("");

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
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setCourse(data.course);
        const mod = data.course.modules.find(
          (m: Module) => m.id === moduleId
        );
        if (mod) {
          setModule(mod);
          setCurrentIndex(data.course.modules.indexOf(mod));
        } else {
          setError("Module not found");
        }
      })
      .catch(() => setError("Course not found"))
      .finally(() => setLoading(false));
  }, [slug, moduleId]);

  useEffect(() => {
    if (!user?.userId) return;
    fetch("/api/courses/progress")
      .then((r) => r.json())
      .then((data) => {
        const p = (data.progress ?? []).find(
          (x: any) => x.courseSlug === slug
        );
        if (p) setProgress(p);
      })
      .catch(() => {});
  }, [user, slug]);

  const nextModule = course?.modules[currentIndex + 1];
  const prevModule = course?.modules[currentIndex - 1];
  const isLastModule = currentIndex === (course?.modules.length ?? 1) - 1;
  const isFirstModule = currentIndex === 0;
  const isCompletedModule = progress
    ? currentIndex < progress.completedModules
    : false;

  async function handleComplete() {
    if (!user?.userId || !course || !module) {
      setUserMessage("Please sign in to track your progress");
      return;
    }

    setSaving(true);
    setUserMessage("");
    try {
      const newCompleted = Math.max(
        (progress?.completedModules ?? 0),
        currentIndex + 1
      );

      const res = await fetch("/api/courses/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          courseSlug: course.slug,
          completedModules: newCompleted,
          totalModules: course.modules.length,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setProgress({
          completedModules: data.progress.completedModules,
          totalModules: data.progress.totalModules,
          completed: data.progress.completed,
        });
        if (data.pointsAwarded > 0) {
          setPointsEarned(data.pointsAwarded);
        }
        setUserMessage("Module completed!");
      } else {
        setUserMessage(data.error || "Failed to update progress");
      }
    } catch {
      setUserMessage("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !course || !module) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-900">
        <AlertCircle className="h-12 w-12 text-slate-300 dark:text-slate-500" />
        <p className="text-sm text-ink-muted">{error || "Module not found"}</p>
        <Link
          href={`/learn/${slug}`}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          Back to course
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="border-b border-ink-line bg-white dark:bg-slate-800">
        <div className="container-page py-4">
          <Link
            href={`/learn/${slug}`}
            className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to {course.title}
          </Link>

          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted">
                Module {currentIndex + 1} of {course.modules.length}
              </span>
              {isCompletedModule && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Completed
                </span>
              )}
            </div>
            <h1 className="mt-1 text-xl font-bold text-ink">
              {module.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-page py-8">
        <div className="mx-auto max-w-2xl">
          {/* Module content */}
          <div className="card">
            {module.content ? (
              <div
                className="prose prose-sm max-w-none text-ink"
                dangerouslySetInnerHTML={{ __html: module.content }}
              />
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <BookOpen className="h-10 w-10 text-slate-300 dark:text-slate-500" />
                <p className="mt-2 text-sm text-ink-muted">
                  Content coming soon
                </p>
              </div>
            )}
          </div>

          {/* Points earned notification */}
          {pointsEarned > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
              <Sparkles className="h-4 w-4" />
              You earned {pointsEarned} points for completing this course!
            </div>
          )}

          {/* User message */}
          {userMessage && !pointsEarned && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-brand-50 p-3 text-sm text-brand-700">
              <AlertCircle className="h-4 w-4" />
              {userMessage}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              {prevModule && (
                <Link
                  href={`/learn/${slug}/${prevModule.id}`}
                  className="inline-flex items-center gap-1 rounded-md border border-ink-line px-4 py-2 text-sm font-medium text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isCompletedModule && (
                <button
                  onClick={handleComplete}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Mark as Complete
                    </>
                  )}
                </button>
              )}

              {isLastModule && isCompletedModule && (
                <Link
                  href={`/learn/${slug}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  <Award className="h-4 w-4" />
                  View Course
                </Link>
              )}

              {nextModule && (
                <Link
                  href={`/learn/${slug}/${nextModule.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
