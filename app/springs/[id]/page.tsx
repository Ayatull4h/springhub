"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  CalendarDays,
  MessageCircle,
  Send,
  User,
  Loader2,
} from "lucide-react";

const fieldLabels: Record<string, string> = {
  spring_name: "Nama Mata Air",
  village: "Desa",
  subdistrict: "Kecamatan",
  province: "Provinsi",
  regency: "Kota / Kabupaten",
  date: "Tanggal",
  flow_condition: "Kondisi Debit / Aliran",
  water_quality: "Kualitas Air",
  cleanliness: "Kebersihan",
  notes: "Catatan",
  activity_types: "Jenis Kegiatan",
  volunteer_count: "Jumlah Relawan",
  measurement: "Pengukuran",
  coordinator_phone: "HP Koordinator",
  volunteer_name: "Nama Relawan",
  trench_count: "Jumlah Rorak",
  dimensions: "Dimensi Rorak",
  tree_count: "Jumlah Pohon",
  tree_species: "Jenis Tanaman",
  species: "Jenis Tanaman",
  count: "Jumlah Bibit",
  contact_name: "Narahubung",
  contact_phone: "HP Narahubung",
};

const formLabels: Record<string, string> = {
  "spring-monitoring": "Pemantauan",
  "spring-restoration": "Restorasi",
  "trench-development": "Rorak",
  "tree-planting": "Tanam Pohon",
  "seedling-stock": "Stok Bibit",
};

const typeColors: Record<string, string> = {
  "spring-monitoring": "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  "spring-restoration": "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "trench-development": "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "tree-planting": "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "seedling-stock": "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
};

type SpringData = {
  id: string;
  name: string;
  province: string | null;
  regency: string | null;
  snappedLat: number | null;
  snappedLng: number | null;
  createdAt: string;
  reports: Array<{
    id: string;
    formSlug: string;
    status: string;
    fieldData: string;
    createdAt: string;
    user: { username: string } | null;
    photos: Array<{ id: string; storagePath: string; fieldId: string }>;
  }>;
};

type Comment = {
  id: string;
  userName: string;
  text: string;
  createdAt: string;
};

function getComments(springId: string): Comment[] {
  try {
    const raw = localStorage.getItem(`spring-comments-${springId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveComments(springId: string, comments: Comment[]) {
  localStorage.setItem(`spring-comments-${springId}`, JSON.stringify(comments));
}

export default function SpringTimelinePage({
  params,
}: {
  params: { id: string };
}) {
  const [spring, setSpring] = useState<SpringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [userName, setUserName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/springs/${params.id}`)
      .then(r => r.json())
      .then(data => { setSpring(data.spring); setLoading(false); })
      .catch(() => { setError("Gagal memuat data"); setLoading(false); });
  }, [params.id]);

  useEffect(() => {
    setComments(getComments(params.id));
  }, [params.id]);

  function handleAddComment() {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      userName: userName.trim() || "Pengunjung",
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...comments, newComment];
    setComments(updated);
    saveComments(params.id, updated);
    setCommentText("");
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="container-page py-20 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600" />
        <p className="mt-3 text-sm text-ink-muted">Memuat data...</p>
      </div>
    );
  }

  if (error || !spring) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold text-ink">Mata air tidak ditemukan</h1>
        <p className="mt-2 text-sm text-ink-muted">{error}</p>
        <Link href="/springs" className="btn-primary mt-4 inline-flex">Lihat Semua Mata Air</Link>
      </div>
    );
  }

  const reportCount = spring.reports.length;
  const latestReport = spring.reports[0];
  const years = [...new Set(spring.reports.map(r => new Date(r.createdAt).getFullYear()))].sort((a: number, b: number) => b - a);

  return (
    <div className="container-page py-12">
      {/* Back link */}
      <Link
        href="/springs"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Semua Mata Air
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-ink">{spring.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
            {spring.province && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{spring.province}{spring.regency ? `, ${spring.regency}` : ""}</span>}
            <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Dipantau sejak {new Date(spring.createdAt).getFullYear()}</span>
            <span className="chip bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">{reportCount} laporan</span>
          </div>
        </div>
      </div>

      {/* Quick info */}
      {latestReport && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="card">
            <p className="text-xs text-ink-subtle">Terakhir diperbarui</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {new Date(latestReport.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="card">
            <p className="text-xs text-ink-subtle">Total laporan</p>
            <p className="mt-1 text-sm font-semibold text-ink">{reportCount} laporan</p>
          </div>
          <div className="card">
            <p className="text-xs text-ink-subtle">Tahun pemantauan</p>
            <p className="mt-1 text-sm font-semibold text-ink">{years.length} tahun</p>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="mt-10">
        <h2 className="text-xl font-bold text-ink">Riwayat Laporan</h2>
        <div className="mt-4 space-y-4">
          {spring.reports.map((report, idx) => {
            let fieldData: Record<string, unknown> = {};
            try { fieldData = JSON.parse(report.fieldData); } catch { fieldData = {}; }

            return (
              <div key={report.id} className="card relative">
                {/* Timeline connector */}
                {idx < spring.reports.length - 1 && (
                  <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-ink-line" />
                )}

                <div className="flex items-start gap-4">
                  {/* Date dot */}
                  <div className="flex flex-col items-center">
                    <div className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                      {new Date(report.createdAt).getFullYear()}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`chip ${typeColors[report.formSlug] || "bg-slate-100 text-slate-700"}`}>
                        {formLabels[report.formSlug] || report.formSlug}
                      </span>
                      <span className="text-xs text-ink-muted">
                        {new Date(report.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
                      </span>
                      <span className="text-xs text-ink-subtle">oleh {report.user?.username || "anonim"}</span>
                    </div>

                    {/* Field data preview */}
                    <div className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                      {Object.entries(fieldData).slice(0, 8).map(([key, val]) => (
                        key !== "_website" && key !== "_submit_time" && key !== "form_slug" && (
                          <div key={key} className="text-xs">
                            <span className="text-ink-subtle">{fieldLabels[key] ?? key.replace(/_/g, " ")}: </span>
                            <span className="text-ink">{Array.isArray(val) ? val.join(", ") : String(val).slice(0, 60)}</span>
                          </div>
                        )
                      ))}
                    </div>

                    {/* Photos */}
                    {report.photos.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {report.photos.map((photo) => (
                          <div key={photo.id} className="h-16 w-16 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700">
                            <img
                              src={photo.storagePath || "/placeholder.svg"}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comments Section */}
      <div className="mt-12">
        <h2 className="flex items-center gap-2 text-xl font-bold text-ink">
          <MessageCircle className="h-5 w-5 text-brand-600" />
          Komentar ({comments.length})
        </h2>

        {/* Comment list */}
        <div className="mt-4 space-y-3">
          {comments.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted">Belum ada komentar. Jadilah yang pertama!</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="card flex items-start gap-3">
                <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/30">
                  <User className="h-4 w-4 text-brand-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">{c.userName}</span>
                    <span className="text-[11px] text-ink-subtle">
                      {new Date(c.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-ink-muted">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment form */}
        <div className="card mt-4">
          <h3 className="text-sm font-semibold text-ink">Tambah Komentar</h3>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="Nama Anda (opsional)"
              maxLength={50}
              className="w-full rounded-md border border-ink-line px-3 py-2 text-sm text-ink placeholder-ink-subtle outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 sm:w-48"
            />
            <div className="flex flex-1 gap-2">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                placeholder="Tulis komentar..."
                maxLength={500}
                className="flex-1 rounded-md border border-ink-line px-3 py-2 text-sm text-ink placeholder-ink-subtle outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <button
                onClick={handleAddComment}
                disabled={!commentText.trim() || submitting}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-40"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Kirim
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
