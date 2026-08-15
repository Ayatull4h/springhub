"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, MapPin, Sparkles, X, Star } from "lucide-react";
import Image from "next/image";
import { useI18n } from "@/lib/i18n";

type ReportPhoto = {
  id: string;
  url: string;
  fieldId: string;
};

type ReportItem = {
  id: string;
  formSlug: string;
  status: string;
  isDummy: boolean;
  fieldData: string;
  preciseLat: number | null;
  preciseLng: number | null;
  snappedLat: number | null;
  snappedLng: number | null;
  createdAt: string;
  submitter: {
    type: string;
    id: string | null;
    name: string | null;
    email: string | null;
  };
  _photos?: ReportPhoto[];
};

export default function AdminReviewPage() {
  const { t } = useI18n();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [featured, setFeatured] = useState<Record<string, string>>({}); // reportId → photoId
  const [photos, setPhotos] = useState<Record<string, ReportPhoto[]>>({});

  const formLabels: Record<string, string> = {
    "spring-monitoring": t("profile.form.springMonitoring"),
    "spring-restoration": t("profile.form.springRestoration"),
    "trench-development": t("profile.form.trenchDevelopment"),
    "tree-planting": t("profile.form.treePlanting"),
    "seedling-stock": t("profile.form.seedlingStock"),
  };

  const fetchPending = () => {
    setLoading(true);
    fetch("/api/admin/reports?status=pending")
      .then((r) => r.json())
      .then((data) => {
        const pending = (data.reports ?? []);
        setReports(pending);
        // Photos sudah disertakan di response (buildPhotoUrls di server)
        const photoMap: Record<string, ReportPhoto[]> = {};
        for (const r of pending) {
          photoMap[r.id] = (r.photos ?? []).map((p: { id: string; url: string; fieldId: string }) => ({
            id: p.id,
            url: p.url,
            fieldId: p.fieldId,
          }));
        }
        setPhotos(photoMap);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPending();
  }, []);

  async function handleApprove(id: string) {
    setProcessing((p) => ({ ...p, [id]: true }));
    try {
      const { token } = await fetch("/api/csrf").then(r => r.json());
      const res = await fetch(`/api/admin/reports/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ featuredPhotoId: featured[id] || null }),
      });
      if (res.ok) {
        setActionMsg(t("admin.reviews.approve") + "!");
        fetchPending();
      } else {
        const data = await res.json();
        setActionMsg(data.error || t("common.error"));
      }
    } catch {
      setActionMsg(t("common.error"));
    }
    setProcessing((p) => ({ ...p, [id]: false }));
    setTimeout(() => setActionMsg(""), 3000);
  }

  async function handleReject(id: string) {
    setProcessing((p) => ({ ...p, [id]: true }));
    try {
      const { token } = await fetch("/api/csrf").then(r => r.json());
      const res = await fetch(`/api/admin/reports/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ note: notes[id] || "" }),
      });
      if (res.ok) {
        setActionMsg(t("admin.reviews.reject") + "ed");
        fetchPending();
      } else {
        const data = await res.json();
        setActionMsg(data.error || t("common.error"));
      }
    } catch {
      setActionMsg(t("common.error"));
    }
    setProcessing((p) => ({ ...p, [id]: false }));
    setTimeout(() => setActionMsg(""), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-ink">{t("admin.reviews.title")}</h2>
        <p className="mt-1 text-sm text-ink-muted">
          {t("admin.reviews.count", { count: String(reports.length) })} · {reports.filter(r => r.isDummy).length} demo
        </p>
      </div>

      {actionMsg && (
        <div className="rounded-md bg-brand-50 dark:bg-brand-900/30 p-3 text-sm text-brand-700 dark:text-brand-300">
          {actionMsg}
        </div>
      )}

      {reports.length === 0 ? (
        <div className="card py-12 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
          <p className="mt-2 text-sm text-ink-muted">{t("admin.reviews.allReviewed")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            let fieldData: Record<string, unknown> = {};
            try { fieldData = JSON.parse(r.fieldData || "{}"); } catch { fieldData = {}; }
            return (
              <div key={r.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="chip bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                      {formLabels[r.formSlug] ?? r.formSlug}
                    </span>
                    {r.isDummy && (
                      <span className="ml-1 chip bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-[10px]">Demo</span>
                    )}
                    <span className="ml-2 text-sm text-ink-muted">
                      {t("common.by")} {r.submitter?.name ?? t("common.guest")}
                    </span>
                  </div>
                  <span className="text-xs text-ink-muted">
                    {new Date(r.createdAt).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Field data preview */}
                <div className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                  {Object.entries(fieldData).filter(([k]) => !k.startsWith("_")).map(([key, val]) => (
                    <div key={key} className="text-xs">
                      <span className="text-ink-subtle">{key}: </span>
                      <span className="text-ink">
                        {Array.isArray(val) ? val.join(", ") : String(val).slice(0, 50)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Photos */}
                {photos[r.id] && photos[r.id].length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1 text-xs font-medium text-ink-subtle">{t("common.photos", "Foto")}</p>
                    <div className="flex flex-wrap gap-2">
                      {photos[r.id].map((photo) => (
                        <div key={photo.id} className="relative">
                          <button
                            type="button"
                            onClick={() => setEnlargedPhoto(photo.url)}
                            className={`h-16 w-16 overflow-hidden rounded-lg border-2 transition-all ${
                              featured[r.id] === photo.id
                                ? "border-brand-500 ring-2 ring-brand-500/30"
                                : "border-ink-line hover:border-brand-300"
                            }`}
                          >
                            <Image
                              src={photo.url}
                              alt=""
                              width={64}
                              height={64}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setFeatured((f) => ({
                                ...f,
                                [r.id]: f[r.id] === photo.id ? "" : photo.id,
                              }))
                            }
                            className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-white shadow ${
                              featured[r.id] === photo.id
                                ? "bg-brand-500"
                                : "bg-slate-400 hover:bg-brand-400"
                            }`}
                            aria-label={featured[r.id] === photo.id ? "Hapus sebagai thumbnail" : "Jadikan thumbnail"}
                          >
                            <Star className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="mt-1 text-[10px] text-ink-subtle">
                      {featured[r.id] ? t("admin.reviews.featured", "Terpilih sebagai thumbnail") : t("admin.reviews.selectFeatured", "Klik ⭐ untuk pilih thumbnail")}
                    </p>
                  </div>
                )}
                {(!photos[r.id] || photos[r.id].length === 0) && (
                  <div className="mt-3 rounded-md border border-amber-300/50 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                    ⚠️ Tidak ada foto terlampir — laporan ini seharusnya punya minimal 3 foto.
                  </div>
                )}

                {/* Location */}
                {(r.preciseLat || r.snappedLat) && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
                    <MapPin className="h-3 w-3" />
                    <span className="font-mono">
                      Precise: {r.preciseLat?.toFixed(4)}, {r.preciseLng?.toFixed(4)}
                    </span>
                    <span className="text-ink-subtle">|</span>
                    <span className="font-mono">
                      Snapped: {r.snappedLat?.toFixed(3)}, {r.snappedLng?.toFixed(3)}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-line pt-3">
                  <input
                    type="text"
                    placeholder={t("admin.reviews.notePlaceholder")}
                    value={notes[r.id] || ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                    className="flex-1 min-w-[200px] rounded-md border border-ink-line px-3 py-1.5 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    onClick={() => handleApprove(r.id)}
                    disabled={processing[r.id]}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 disabled:opacity-50"
                  >
                    {processing[r.id] ? (
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    {t("admin.reviews.approve")}
                  </button>
                  <button
                    onClick={() => handleReject(r.id)}
                    disabled={processing[r.id]}
                    className="inline-flex items-center gap-1 rounded-md bg-red-50 dark:bg-red-900/30 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-100 disabled:opacity-50"
                  >
                    {processing[r.id] ? (
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-700 border-t-transparent" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    {t("admin.reviews.reject")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {enlargedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setEnlargedPhoto(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <button
              type="button"
              onClick={() => setEnlargedPhoto(null)}
              className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg hover:bg-slate-100"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
            <Image
              src={enlargedPhoto}
              alt=""
              width={1200}
              height={800}
              className="h-auto max-h-[85vh] w-auto max-w-[85vw] rounded-lg object-contain"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  );
}
