"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, MapPin, Sparkles, X, Star } from "lucide-react";
import Image from "next/image";
import { useI18n } from "@/lib/i18n";
import { composeStory, supportedStoryForm } from "@/lib/story-template";

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
  const [enlargedList, setEnlargedList] = useState<string[]>([]);
  const [revPage, setRevPage] = useState(1);
  const REV_PER_PAGE = 10;

  useEffect(() => {
    setRevPage((p) => Math.min(p, Math.max(1, Math.ceil(reports.length / REV_PER_PAGE))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports.length]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [narratives, setNarratives] = useState<Record<string, string>>({});
  const [narrativesEn, setNarrativesEn] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [featured, setFeatured] = useState<Record<string, string>>({}); // reportId → photoId
  const [photos, setPhotos] = useState<Record<string, ReportPhoto[]>>({});
  const [nearby, setNearby] = useState<Record<string, { loading: boolean; list: Array<{ id: string; name: string; status: string; distanceM: number; sameName: boolean }> | null }>>({});

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
        // Prefill narasi otomatis dari template (ID + EN) — admin tinggal poles.
        // Entri yang sudah diubah admin tidak ditimpa.
        setNarratives((prev) => {
          const next = { ...prev };
          for (const r of pending) {
            if (next[r.id] === undefined && supportedStoryForm(r.formSlug)) {
              next[r.id] = composeStory(r.formSlug, r.fieldData, {}, "id").narrative;
            }
          }
          return next;
        });
        setNarrativesEn((prev) => {
          const next = { ...prev };
          for (const r of pending) {
            if (next[r.id] === undefined && supportedStoryForm(r.formSlug)) {
              next[r.id] = composeStory(r.formSlug, r.fieldData, {}, "en").narrative;
            }
          }
          return next;
        });
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
        body: JSON.stringify({
          featuredPhotoId: featured[id] || null,
          landingNarrative: narratives[id]?.trim() || "",
          landingNarrativeEn: narrativesEn[id]?.trim() || "",
        }),
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

  async function checkNearby(id: string) {
    setNearby((n) => ({ ...n, [id]: { loading: true, list: null } }));
    try {
      const { token } = await fetch("/api/csrf").then((r) => r.json());
      const res = await fetch(`/api/admin/reports/${id}/nearby-springs`, {
        headers: { "x-csrf-token": token },
      });
      const data = await res.json();
      setNearby((n) => ({ ...n, [id]: { loading: false, list: data.nearby ?? [] } }));
    } catch {
      setNearby((n) => ({ ...n, [id]: { loading: false, list: [] } }));
    }
  }

  async function handleReject(id: string) {    setProcessing((p) => ({ ...p, [id]: true }));
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
          {reports.slice((revPage - 1) * REV_PER_PAGE, revPage * REV_PER_PAGE).map((r) => {
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
                            onClick={() => {
                              setEnlargedList(photos[r.id].map((p) => p.url));
                              setEnlargedPhoto(photo.url);
                            }}
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
                              loading="lazy"
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

                {/* Cek duplikat lokasi — titik lain ≤50 m */}
                <div className="mt-2">
                  {!nearby[r.id] ? (
                    <button
                      type="button"
                      onClick={() => checkNearby(r.id)}
                      className="text-[11px] font-medium text-brand-600 hover:underline dark:text-brand-400"
                    >
                      Cek titik sekitar (duplikat?)
                    </button>
                  ) : nearby[r.id].loading ? (
                    <p className="text-[11px] text-ink-muted">Memeriksa titik sekitar…</p>
                  ) : nearby[r.id].list!.length === 0 ? (
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      ✓ Tidak ada titik lain dalam 50 m — aman berdiri sendiri.
                    </p>
                  ) : (
                    <div className="rounded-md border border-amber-300/60 bg-amber-50/70 p-2 text-[11px] dark:border-amber-700/50 dark:bg-amber-900/20">
                      <p className="font-semibold text-amber-800 dark:text-amber-200">
                        ⚠️ Ada titik lain di dekat sini:
                      </p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-amber-900 dark:text-amber-100">
                        {nearby[r.id].list!.map((s) => (
                          <li key={s.id}>
                            {s.name} — ±{s.distanceM} m ({s.status})
                            {s.sameName ? " · nama SAMA" : " · nama BEDA"}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-1 text-amber-800 dark:text-amber-200">
                        Kalau ternyata titik yang sama dengan nama beda, gabungkan lewat Manajemen Spring → Gabung.
                      </p>
                    </div>
                  )}
                </div>

                {["spring-monitoring", "spring-restoration", "tree-planting", "trench-development"].includes(r.formSlug) && (
                  <div className="mt-3 rounded-md border border-emerald-300/40 bg-emerald-50/60 p-3 dark:border-emerald-700/40 dark:bg-emerald-900/20">
                    <label
                      htmlFor={`landing-narrative-${r.id}`}
                      className="text-xs font-semibold text-emerald-800 dark:text-emerald-200"
                    >
                      {t("admin.reviews.landingNarrative", "Narasi singkat untuk landing page")}
                    </label>
                    <textarea
                      id={`landing-narrative-${r.id}`}
                      value={narratives[r.id] || ""}
                      onChange={(e) =>
                        setNarratives((n) => ({ ...n, [r.id]: e.target.value }))
                      }
                      maxLength={1000}
                      rows={2}
                      placeholder={t(
                        "admin.reviews.landingNarrativePlaceholder",
                        "Tulis 1–2 kalimat tentang sebelum dan sesudah restorasi..."
                      )}
                      className="mt-1.5 w-full resize-y rounded-md border border-ink-line bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:bg-slate-800 dark:text-white"
                    />
                    <textarea
                      id={`landing-narrative-en-${r.id}`}
                      value={narrativesEn[r.id] || ""}
                      onChange={(e) =>
                        setNarrativesEn((n) => ({ ...n, [r.id]: e.target.value }))
                      }
                      maxLength={1000}
                      rows={2}
                      placeholder="English version (auto-filled, edit if needed)…"
                      className="mt-1.5 w-full resize-y rounded-md border border-ink-line bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:bg-slate-800 dark:text-white"
                    />
                    <div className="mt-1 flex items-start justify-between gap-3">
                      <p className="text-[10px] text-ink-muted">
                        {t(
                          "admin.reviews.landingNarrativeHint",
                          "Akan tampil di section Jejak Pulih setelah laporan disetujui. Maks. 1000 karakter."
                        )}
                      </p>
                      <span className="shrink-0 text-[10px] tabular-nums text-ink-subtle">
                        {(narratives[r.id] || "").length}/{(narrativesEn[r.id] || "").length} · 1000
                      </span>
                    </div>
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

      {Math.ceil(reports.length / REV_PER_PAGE) > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setRevPage((p) => Math.max(1, p - 1))}
            disabled={revPage <= 1}
            className="rounded-md border border-ink-line px-3 py-1 text-xs disabled:opacity-40"
          >
            ←
          </button>
          <span className="text-xs text-ink-muted">
            {revPage} / {Math.max(1, Math.ceil(reports.length / REV_PER_PAGE))}
          </span>
          <button
            type="button"
            onClick={() => setRevPage((p) => Math.min(Math.ceil(reports.length / REV_PER_PAGE), p + 1))}
            disabled={revPage >= Math.ceil(reports.length / REV_PER_PAGE)}
            className="rounded-md border border-ink-line px-3 py-1 text-xs disabled:opacity-40"
          >
            →
          </button>
        </div>
      )}

      {enlargedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => { setEnlargedPhoto(null); setEnlargedList([]); } }
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <button
              type="button"
              onClick={() => { setEnlargedPhoto(null); setEnlargedList([]); } }
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
            {enlargedList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const i = enlargedList.indexOf(enlargedPhoto);
                    setEnlargedPhoto(enlargedList[(i - 1 + enlargedList.length) % enlargedList.length]);
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                  aria-label="Foto sebelumnya"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const i = enlargedList.indexOf(enlargedPhoto);
                    setEnlargedPhoto(enlargedList[(i + 1) % enlargedList.length]);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                  aria-label="Foto berikutnya"
                >
                  ›
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
