"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, MapPin, TreePine, Droplets, Users, Loader2, Heart, MessageSquare,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

type FeaturedProject = {
  id: string;
  title: string;
  summary: string;
  region: string;
  status: string;
  goalAmount: number;
  raisedAmount: number;
  typeId: string;
  likes: number;
  comments: number;
  user: { username: string } | null;
};

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

export function FeaturedProjects() {
  const [projects, setProjects] = useState<FeaturedProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        if (data.projects) {
          setProjects(data.projects.filter((p: FeaturedProject) => p.status === "approved").slice(0, 3));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="bg-gradient-to-b from-emerald-50 to-white py-20 dark:from-emerald-950/50 dark:to-slate-900">
        <div className="container-page text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </section>
    );
  }

  if (projects.length === 0) return null;

  return (
    <section className="bg-gradient-to-b from-emerald-50 to-white py-20 dark:from-emerald-950/50 dark:to-slate-900">
      <div className="container-page">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Proyek Unggulan
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-ink-muted">
            Proyek konservasi yang sedang berjalan dan butuh dukungan Anda
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const typeInfo = TYPE_INFO[p.typeId] || { icon: TreePine, label: p.typeId };
            const Icon = typeInfo.icon;
            const progress = p.goalAmount > 0 ? Math.round((p.raisedAmount / p.goalAmount) * 100) : 0;
            return (
              <Link key={p.id} href={`/projects/${p.id}`} className="group block">
                <article className="card flex flex-col h-full transition-shadow hover:shadow-lg">
                  <div className="-mx-4 -mt-4 mb-3 flex h-32 items-center justify-center rounded-t-xl bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-900/40 dark:to-teal-900/20">
                    <Icon className="h-12 w-12 text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="chip text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {typeInfo.label}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-ink group-hover:text-emerald-600 transition-colors">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted line-clamp-2 flex-1">{p.summary}</p>
                  <div className="mt-2 flex items-center gap-1 text-xs text-ink-muted">
                    <MapPin className="h-3 w-3" />
                    {p.region}
                  </div>
                  {p.user?.username && (
                    <p className="mt-1 text-xs text-ink-subtle">oleh {p.user.username}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-xs text-ink-muted">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-3 w-3" /> {p.likes ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> {p.comments ?? 0}
                    </span>
                  </div>
                  {p.goalAmount > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-ink-muted">
                        <span>Rp {formatNumber(p.raisedAmount)}</span>
                        <span>Rp {formatNumber(p.goalAmount)}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 group-hover:underline">
                      Lihat Detail
                    </span>
                    <ArrowRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </article>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link href="/projects" className="btn-primary inline-flex items-center gap-1.5">
            Lihat Semua Proyek <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
