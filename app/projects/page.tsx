"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { MapPin, Users, TreePine, Droplets, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { formatNumber } from "@/lib/utils";

type ProjectItem = {
  id: string;
  title: string;
  summary: string;
  region: string;
  status: string;
  goalAmount: number;
  raisedAmount: number;
  typeId: string;
  createdAt: string;
};

const TYPE_ICONS: Record<string, typeof TreePine> = {
  spring_restoration: Droplets,
  "spring-restoration": Droplets,
  tree_planting: TreePine,
  "tree-planting": TreePine,
  trench_development: Users,
  "trench-development": Users,
  monitoring_expedition: MapPin,
  "monitoring-expedition": MapPin,
  "seedling-stock": TreePine,
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu",
  under_review: "Ditinjau",
  approved: "Aktif",
  completed: "Selesai",
  rejected: "Ditolak",
};

const PER_PAGE = 9;

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        if (data.projects) {
          setProjects(data.projects);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(projects.length / PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const visible = useMemo(
    () => projects.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE),
    [projects, safePage]
  );

  return (
    <main className="min-h-screen">
      <section className="bg-gradient-to-b from-sky-50 to-white py-20 dark:from-sky-950 dark:to-slate-900">
        <div className="container-page text-center">
          <TreePine className="mx-auto h-12 w-12 text-sky-600 dark:text-sky-400" />
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
            Proyek Konservasi
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-ink-muted">
            Jelajahi proyek-proyek konservasi mata air yang sedang berjalan dan dukung dampak positifnya
          </p>
        </div>
      </section>

      <section className="container-page py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
          </div>
        ) : projects.length === 0 ? (
          <div className="py-20 text-center">
            <TreePine className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="mt-4 text-ink-muted">Belum ada proyek konservasi.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((p) => {
                const Icon = TYPE_ICONS[p.typeId] || TreePine;
                const progress = p.goalAmount > 0 ? Math.round((p.raisedAmount / p.goalAmount) * 100) : 0;
                return (
                  <article key={p.id} className="card flex flex-col">
                    <div className="-mx-4 -mt-4 mb-3 flex h-32 items-center justify-center rounded-t-xl bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-900/30 dark:to-sky-900/50">
                      <Icon className="h-12 w-12 text-sky-500 dark:text-sky-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`chip text-xs ${p.status === "approved" ? "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300" : "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                        {STATUS_LABEL[p.status] || p.status}
                      </span>
                    </div>
                    <h2 className="mt-2 text-lg font-semibold text-ink">{p.title}</h2>
                    <p className="mt-1 text-sm text-ink-muted line-clamp-2">{p.summary}</p>
                    <div className="mt-2 flex items-center gap-1 text-xs text-ink-muted">
                      <MapPin className="h-3 w-3" />
                      {p.region}
                    </div>
                    {p.goalAmount > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-ink-muted">
                          <span>Rp {formatNumber(p.raisedAmount)}</span>
                          <span>Rp {formatNumber(p.goalAmount)}</span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                          <div
                            className="h-full rounded-full bg-sky-500 transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-ink-subtle">{progress}% terkumpul</p>
                      </div>
                    )}
                    <Link
                      href={`/projects/${p.id}`}
                      className="btn-secondary mt-5 inline-flex items-center justify-center gap-1.5"
                    >
                      Lihat Detail <ArrowRight className="h-4 w-4" />
                    </Link>
                  </article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  className="inline-flex items-center gap-1 rounded-lg border border-ink-line px-3 py-2 text-xs font-medium text-ink-muted transition hover:bg-white hover:text-ink disabled:opacity-30 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Sebelumnya
                </button>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`h-2 rounded-full transition-all ${
                        i === safePage
                          ? "w-6 bg-sky-500"
                          : "w-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={safePage >= totalPages - 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-ink-line px-3 py-2 text-xs font-medium text-ink-muted transition hover:bg-white hover:text-ink disabled:opacity-30 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  Selanjutnya <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
