"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Layers,
  Clock,
  AlertCircle,
  Users,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

type CourseModule = {
  id: string;
  title: string;
  sortOrder: number;
};

type CourseItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  modules: CourseModule[];
  _count: { progress: number };
  createdAt: string;
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [deleting, setDeleting] = useState<string | null>(null);
  const { t } = useI18n();

  const fetchCourses = () => {
    setLoading(true);
    fetch("/api/admin/courses")
      .then((r) => r.json())
      .then((data) => setCourses(data.courses ?? []))
      .catch(() => setError(t("admin.courses.failedLoad")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  async function handleDelete(id: string, title: string) {
    if (!confirm(t("admin.courses.confirmDelete", { title })))
      return;
    setDeleting(id);
    try {
      const { token: csrfToken } = await fetch("/api/csrf").then(r => r.json());
      const res = await fetch(`/api/admin/courses/${id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrfToken },
      });
      if (res.ok) {
        setCourses((prev) => prev.filter((c) => c.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || t("admin.courses.failedDelete"));
      }
    } catch {
      alert("Failed to delete course");
    } finally {
      setDeleting(null);
    }
  }

  const filtered =
    filter === "all"
      ? courses
      : filter === "active"
        ? courses.filter((c) => c.isActive)
        : courses.filter((c) => !c.isActive);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">{t("admin.courses.title")}</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {t("admin.courses.total", { count: String(courses.length), plural: courses.length !== 1 ? "s" : "" })}
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          {t("admin.courses.new")}
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "active", "inactive"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              filter === f
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-ink-muted hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card py-12 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm text-ink-muted">{t("admin.courses.noCourses")}</p>
          {filter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              className="mt-2 text-xs text-brand-600 hover:underline"
            >
              {t("admin.courses.showAll")}
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <div
              key={course.id}
              className="card flex flex-col"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    course.isActive
                      ? "bg-brand-50 text-brand-600"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1">
                  {!course.isActive && (
                    <span className="rounded-md bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      {t("admin.courses.inactive")}
                    </span>
                  )}
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="rounded-md p-1.5 text-ink-muted hover:bg-slate-100 hover:text-ink dark:hover:bg-slate-700 dark:hover:text-white"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(course.id, course.title)}
                    disabled={deleting === course.id}
                    className="rounded-md p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="mt-3 text-sm font-semibold text-ink">
                {course.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
                {course.description || t("admin.courses.noDescription")}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                <span className="rounded-md bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 text-emerald-700 dark:text-emerald-300">
                  {course.level}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {course.duration}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  {t("admin.courses.modules", { count: String(course.modules.length), plural: course.modules.length !== 1 ? "s" : "" })}
                </span>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-ink-line pt-3">
                <span className="inline-flex items-center gap-1 text-xs text-ink-subtle">
                  <Users className="h-3 w-3" />
                  {t("admin.courses.enrolled", { count: String(course._count.progress) })}
                </span>
                <span className="font-mono text-[10px] text-ink-subtle">
                  {course.slug}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
