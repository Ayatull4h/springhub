"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, ArrowLeft, ArrowRightCircle, Heart, MessageSquare,
  MapPin, TreePine, Droplets, Users,
} from "lucide-react";
import { featuredProjects as dummyData } from "@/lib/data";
import { formatNumber } from "@/lib/utils";

type ProjectItem = {
  id?: string;
  title: string;
  summary: string;
  region: string;
  status: string;
  goalAmount: number;
  raisedAmount: number;
  typeId: string;
  likes: number;
  comments: number;
  user?: { username: string } | null;
};

const DUMMY: ProjectItem[] = dummyData.map((d, i) => ({
  id: `dummy-${i}`,
  title: d.title,
  summary: d.summary,
  region: d.region,
  status: d.status,
  goalAmount: d.goal,
  raisedAmount: d.raised,
  typeId: d.typeId,
  likes: d.likes,
  comments: d.comments,
}));

const TYPE_INFO: Record<string, { icon: typeof TreePine; label: string }> = {
  spring_restoration: { icon: Droplets, label: "Restorasi Mata Air" },
  "spring-restoration": { icon: Droplets, label: "Restorasi Mata Air" },
  tree_planting: { icon: TreePine, label: "Tanam Pohon" },
  "tree-planting": { icon: TreePine, label: "Tanam Pohon" },
  trench_development: { icon: Users, label: "Rorak / Trench" },
  "trench-development": { icon: Users, label: "Rorak / Trench" },
  monitoring_expedition: { icon: MapPin, label: "Monitoring" },
  "monitoring-expedition": { icon: MapPin, label: "Monitoring" },
  "seedling-stock": { icon: TreePine, label: "Pembibitan" },
};

const PER_PAGE = 2;

export function FeaturedProjects() {
  const [allProjects, setAllProjects] = useState<ProjectItem[]>(DUMMY);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        if (data.projects?.length) {
          const approved = data.projects.filter((p: ProjectItem) => p.status === "approved");
          if (approved.length > 0) setAllProjects(approved);
        }
      })
      .catch(() => {});
  }, []);

  const totalPages = Math.max(1, Math.ceil(allProjects.length / PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * PER_PAGE;
  const visible = allProjects.slice(start, start + PER_PAGE);

  return (
    <>
      <div>
        <h3 className="text-lg font-bold tracking-tight text-ink">
          Proyek Unggulan
        </h3>

        <div className="mt-6 grid grid-cols-2 gap-4">
          {visible.map((p) => {
            const info = TYPE_INFO[p.typeId] || { icon: TreePine, label: p.typeId };
            const Icon = info.icon;
            const progress = p.goalAmount > 0 ? Math.round((p.raisedAmount / p.goalAmount) * 100) : 0;
            return (
              <Link key={p.id || p.title} href={p.id ? `/projects/${p.id}` : "/projects"} className="group block">
                <article className="card flex flex-col overflow-hidden transition-all hover:shadow-lg">
                  <div className="flex h-20 items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/20">
                    <Icon className="h-8 w-8 text-emerald-400/50 dark:text-emerald-500/30" />
                  </div>
                  <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
                    <span className="mb-2 inline-flex w-fit rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {info.label}
                    </span>
                    <h3 className="text-sm font-semibold text-ink group-hover:text-emerald-600 transition-colors">
                      {p.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted line-clamp-2">
                      {p.summary}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-xs text-ink-subtle">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {p.region}
                    </div>
                    {p.goalAmount > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-ink-muted">
                          <span>Rp {formatNumber(p.raisedAmount)}</span>
                          <span>Rp {formatNumber(p.goalAmount)}</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                          <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                        </div>
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-3 text-xs text-ink-muted">
                      <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3 text-rose-400" />{p.likes ?? 0}</span>
                      <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3 text-sky-400" />{p.comments ?? 0}</span>
                    </div>
                    <div className="mt-auto pt-3 flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Lihat Detail <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage === 0}
              className="text-xs text-ink-muted hover:text-ink disabled:opacity-30 dark:hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setPage(i)}
                  className={`h-1.5 rounded-full transition-all ${i === safePage ? "w-4 bg-emerald-500" : "w-1.5 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500"}`}
                />
              ))}
            </div>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1}
              className="text-xs text-ink-muted hover:text-ink disabled:opacity-30 dark:hover:text-white"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="mt-5">
          <Link href="/projects" className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
            Lihat Semua Proyek <ArrowRightCircle className="h-3 w-3 inline" />
          </Link>
        </div>
      </div>
    </>
  );
}
