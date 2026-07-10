"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MapPin, TreePine, Droplets, Users,
  Calendar, Loader2, MessageSquare, Heart,
} from "lucide-react";
import { CommentsSection } from "@/components/projects/CommentsSection";
import { formatNumber } from "@/lib/utils";

type ProjectDetail = {
  id: string;
  title: string;
  summary: string;
  region: string;
  status: string;
  goalAmount: number;
  raisedAmount: number;
  typeId: string;
  createdAt: string;
  likes: number;
  comments: number;
  user: { username: string } | null;
  _count: { donations: number; comments: number };
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

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu",
  under_review: "Ditinjau",
  approved: "Aktif",
  rejected: "Ditolak",
  completed: "Selesai",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liking, setLiking] = useState(false);

  const fetchDetail = useCallback(async () => {
    const id = params?.id as string;
    try {
      // Fetch like status in parallel
      const [detailRes, likeRes] = await Promise.all([
        fetch(`/api/projects/${id}`),
        fetch(`/api/projects/${id}/like`),
      ]);
      if (!detailRes.ok) {
        setNotFound(true);
        return;
      }
      const detailData = await detailRes.json();
      if (detailData.project) {
        setProject(detailData.project);
      } else {
        setNotFound(true);
        return;
      }
      const likeData = await likeRes.json();
      setLiked(likeData.liked ?? false);
      setLikeCount(likeData.likes ?? 0);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [params?.id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  async function handleLike() {
    if (liking) return;
    setLiking(true);
    try {
      const res = await fetch(`/api/projects/${params?.id}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikeCount(data.likes);
      }
    } catch {
      // silent
    } finally {
      setLiking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <TreePine className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
          <p className="mt-4 text-ink-muted">Proyek tidak ditemukan</p>
          <Link href="/projects" className="btn-primary mt-6 inline-flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Proyek
          </Link>
        </div>
      </div>
    );
  }

  const typeInfo = TYPE_INFO[project.typeId] || { icon: TreePine, label: project.typeId };
  const Icon = typeInfo.icon;
  const progress = project.goalAmount > 0 ? Math.round((project.raisedAmount / project.goalAmount) * 100) : 0;

  return (
    <main className="min-h-screen">
      <section className="bg-gradient-to-b from-sky-50 to-white py-12 dark:from-sky-950 dark:to-slate-900">
        <div className="container-page">
          <Link
            href="/projects"
            className="mb-6 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Proyek
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/50">
              <Icon className="h-7 w-7 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="chip bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                  {typeInfo.label}
                </span>
                {project.status && (
                  <span className={`chip text-xs ${
                    project.status === "approved"
                      ? "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
                      : project.status === "completed"
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}>
                    {STATUS_LABEL[project.status] || project.status}
                  </span>
                )}
              </div>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
                {project.title}
              </h1>
              {project.user?.username && (
                <p className="mt-1 text-sm text-ink-muted">
                  oleh {project.user.username}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-ink">Tentang Proyek</h2>
            <p className="mt-3 text-ink-muted leading-relaxed">{project.summary}</p>

            <div className="mt-8 space-y-4">
              <h2 className="text-xl font-bold text-ink">Detail</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                  <MapPin className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  <p className="mt-1 text-sm font-medium text-ink">Lokasi</p>
                  <p className="text-sm text-ink-muted">{project.region}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                  <Calendar className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  <p className="mt-1 text-sm font-medium text-ink">Dibuat</p>
                  <p className="text-sm text-ink-muted">
                    {new Date(project.createdAt).toLocaleDateString("id-ID", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Likes & Comments stats */}
            <div className="mt-6 flex items-center gap-4 text-sm text-ink-muted">
              <button
                onClick={handleLike}
                disabled={liking}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 transition-colors ${
                  liked
                    ? "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
                    : "border-ink-line hover:border-red-200 hover:text-red-600 dark:hover:border-red-800 dark:hover:text-red-400"
                }`}
              >
                <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                {likeCount}
              </button>
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                {project.comments ?? 0}
              </span>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="text-lg font-bold text-ink">Perkembangan Pendanaan</h3>
              {project.goalAmount > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-sky-600 dark:text-sky-400">
                      Rp {formatNumber(project.raisedAmount)}
                    </span>
                    <span className="text-ink-muted">dari Rp {formatNumber(project.goalAmount)}</span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-sky-500 transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-center text-sm font-medium text-ink">{progress}%</p>
                </div>
              )}
              <div className="mt-6 space-y-3 text-sm text-ink-muted">
                <div className="flex justify-between">
                  <span>Target</span>
                  <span className="font-medium text-ink">Rp {formatNumber(project.goalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Terkumpul</span>
                  <span className="font-medium text-sky-600 dark:text-sky-400">
                    Rp {formatNumber(project.raisedAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sisa</span>
                  <span className="font-medium text-ink">
                    Rp {formatNumber(Math.max(0, project.goalAmount - project.raisedAmount))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comments section */}
      <section className="container-page py-8 border-t border-ink-line">
        <CommentsSection projectId={project.id} />
      </section>
    </main>
  );
}
