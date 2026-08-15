"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Clock, Layers, Sparkles, Loader2, GraduationCap } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Module = {
  id: string;
  title: string;
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

export default function LearnPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((data) => {
        if (data.courses?.length) {
          setCourses(data.courses);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen">
      <section className="bg-gradient-to-b from-brand-50 to-white py-20 dark:from-brand-950 dark:to-slate-900">
        <div className="container-page text-center">
          <GraduationCap className="mx-auto h-12 w-12 text-brand-600 dark:text-brand-400" />
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
            <span>{t("learn.title")}</span> <span>{t("learn.titleAccent")}</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-ink-muted">
            {t("learn.page.subtitle")}
          </p>
        </div>
      </section>

      <section className="container-page py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <BookOpen className="h-10 w-10 text-brand-300" />
            <p className="mt-3 text-sm text-ink-muted">Belum ada kursus. Nantikan modul belajar segera.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <article key={c.id} className="card flex flex-col">
                <div className="-mx-4 -mt-4 mb-3 flex h-36 items-center justify-center rounded-t-xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-900/50">
                  <BookOpen className="h-14 w-14 text-indigo-500 dark:text-indigo-400" />
                </div>
                <span className="chip mt-4 self-start bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                  {c.level}
                </span>
                <h2 className="mt-2 text-lg font-semibold text-ink">{c.title}</h2>
                <p className="mt-1 text-sm text-ink-muted line-clamp-2">{c.description}</p>
                <div className="mt-4 flex items-center gap-4 text-xs text-ink-muted">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {c.duration}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    {c.modules.length} {t("learn.course.modules", { count: String(c.modules.length) })}
                  </span>
                </div>
                <Link
                  href={`/learn/${c.slug}`}
                  className="btn-primary mt-5 inline-flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="h-4 w-4" />
                  {t("learn.course.start")}
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
