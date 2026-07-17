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

const DUMMY_COURSES: Course[] = [
  {
    id: "dummy-1",
    slug: "dasar-konservasi-mata-air",
    title: "Dasar-Dasar Konservasi Mata Air",
    description: "Pelajari konsep fundamental konservasi mata air, siklus hidrologi, dan pentingnya menjaga sumber air bersih di Indonesia.",
    level: "Pemula",
    duration: "45 menit",
    icon: "book",
    modules: [
      { id: "m1", title: "Apa Itu Mata Air?", sortOrder: 1 },
      { id: "m2", title: "Siklus Hidrologi", sortOrder: 2 },
      { id: "m3", title: "Ancaman terhadap Mata Air", sortOrder: 3 },
    ],
  },
  {
    id: "dummy-2",
    slug: "teknik-restorasi-spring",
    title: "Teknik Restorasi Mata Air",
    description: "Panduan langkah demi langkah untuk merestorasi mata air yang rusak, termasuk teknik pengerukan dan penataan area sekitar.",
    level: "Menengah",
    duration: "60 menit",
    icon: "book",
    modules: [
      { id: "m1", title: "Identifikasi Kerusakan", sortOrder: 1 },
      { id: "m2", title: "Teknik Pengerukan", sortOrder: 2 },
      { id: "m3", title: "Penataan Bibir Mata Air", sortOrder: 3 },
      { id: "m4", title: "Pasca-Restorasi", sortOrder: 4 },
    ],
  },
  {
    id: "dummy-3",
    slug: "monitoring-berbasis-komunitas",
    title: "Monitoring Berbasis Komunitas",
    description: "Cara melakukan monitoring mata air secara partisipatif bersama masyarakat, termasuk pengukuran debit dan kualitas air.",
    level: "Lanjutan",
    duration: "90 menit",
    icon: "book",
    modules: [
      { id: "m1", title: "Pengantar Monitoring", sortOrder: 1 },
      { id: "m2", title: "Alat dan Bahan", sortOrder: 2 },
      { id: "m3", title: "Pengukuran Debit Air", sortOrder: 3 },
      { id: "m4", title: "Uji Kualitas Air", sortOrder: 4 },
      { id: "m5", title: "Pelaporan Data", sortOrder: 5 },
    ],
  },
];

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
        } else {
          setCourses(DUMMY_COURSES);
        }
      })
      .catch(() => setCourses(DUMMY_COURSES))
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
