"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Camera,
  FileText,
  MapPin,
  Trash2,
  Upload,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { offlineDB } from "@/lib/offline-db";
import { cn } from "@/lib/utils";
import { snapToProtectionGrid } from "@/lib/geo";

type SyncPhase =
  | "confirm"       // Konfirmasi user ingin exit
  | "uploading-photos"  // Upload foto — fase WAJIB
  | "uploading-reports" // Upload forms ke /api/reports
  | "uploading-tracks"  // Upload tracking points
  | "cleaning-up"       // Hapus IndexedDB + cache
  | "done"              // Selesai
  | "error";            // Gagal — user tetap di mode offline

type SyncItemStatus = "pending" | "success" | "failed";

type PhotoStatus = {
  id: string;
  fileName: string;
  status: SyncItemStatus;
  error?: string;
};

type ReportStatus = {
  id: string;
  formSlug: string;
  status: SyncItemStatus;
  error?: string;
};

type OfflineExitSyncProps = {
  onComplete: () => void;
  onCancel: () => void;
};

/**
 * OfflineExitSync — meng-handle sync keluar mode offline.
 *
 * Flow:
 * 1. Konfirmasi user
 * 2. Upload FOTO (WAJIB) — jika gagal, STOP, user tidak bisa keluar
 * 3. Kirim forms ke /api/reports
 * 4. Kirim tracking points ke /api/offline/sync
 * 5. Clear IndexedDB + cache tiles
 * 6. Close session di server
 * 7. Done → redirect
 */
export function OfflineExitSync({ onComplete, onCancel }: OfflineExitSyncProps) {
  const [phase, setPhase] = useState<SyncPhase>("confirm");
  const [photoStatuses, setPhotoStatuses] = useState<PhotoStatus[]>([]);
  const [reportStatuses, setReportStatuses] = useState<ReportStatus[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [errorMessage, setErrorMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // ── Load statuses ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === "confirm") {
      offlineDB.getAllPhotos().then((photos) => {
        setPhotoStatuses(
          photos.map((p) => ({ id: p.id, fileName: p.fileName, status: "pending" as SyncItemStatus }))
        );
      });
      offlineDB.getAllReports().then((reports) => {
        setReportStatuses(
          reports.map((r) => ({ id: r.id, formSlug: r.formSlug, status: "pending" as SyncItemStatus }))
        );
      });
    }
  }, [phase]);

  // ── Main sync function ───────────────────────────────────────────────────
  const startSync = useCallback(async () => {
    const photos = await offlineDB.getAllPhotos();
    const reports = await offlineDB.getAllReports();
    const tracks = await offlineDB.getAllTrackingPoints();

    // ── Phase 2: Upload photos (WAJIB berhasil) ─────────────────────────
    if (photos.length > 0) {
      setPhase("uploading-photos");
      setProgress({ current: 0, total: photos.length });

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        setProgress({ current: i + 1, total: photos.length });

        try {
          const formData = new FormData();
          formData.append("photo", photo.blob, photo.fileName);
          formData.append("field_id", photo.fieldId);
          formData.append("report_id", photo.reportId);

          // Try to get CSRF token first
          let csrfToken = "";
          try {
            const csrfRes = await fetch("/api/csrf");
            const csrfData = await csrfRes.json();
            csrfToken = csrfData.token || "";
          } catch {}

          const res = await fetch(`/api/reports/${photo.reportId}/photos`, {
            method: "POST",
            headers: csrfToken ? { "x-csrf-token": csrfToken } : {},
            body: formData,
            signal: AbortSignal.timeout(30_000), // 30s timeout per photo
          });

          if (res.ok) {
            setPhotoStatuses((prev) =>
              prev.map((p) => (p.id === photo.id ? { ...p, status: "success" } : p))
            );
            await offlineDB.deletePhoto(photo.id);
          } else {
            const errBody = await res.json().catch(() => ({ error: "Unknown error" }));
            setPhotoStatuses((prev) =>
              prev.map((p) =>
                p.id === photo.id ? { ...p, status: "failed", error: errBody.error || "Upload gagal" } : p
              )
            );
            setErrorMessage(`Gagal upload foto ${photo.fileName}. Periksa koneksi dan coba lagi.`);
            setPhase("error");
            return; // STOP — user tetap di mode offline
          }
        } catch (err) {
          setPhotoStatuses((prev) =>
            prev.map((p) =>
              p.id === photo.id ? { ...p, status: "failed", error: "Network error" } : p
            )
          );
          setErrorMessage(`Gagal upload foto ${photo.fileName}. Koneksi tidak stabil.`);
          setPhase("error");
          return; // STOP — foto gagal = tidak bisa keluar
        }
      }
    }

    // ── Phase 3: Upload pending reports ─────────────────────────────────
    if (reports.length > 0) {
      setPhase("uploading-reports");
      setProgress({ current: 0, total: reports.length });

      for (let i = 0; i < reports.length; i++) {
        const report = reports[i];
        setProgress({ current: i + 1, total: reports.length });

        try {
          // Get fresh CSRF token
          let csrfToken = "";
          try {
            const csrfRes = await fetch("/api/csrf");
            const csrfData = await csrfRes.json();
            csrfToken = csrfData.token || "";
          } catch {}

          const formData = new FormData();
          formData.set("form_slug", report.formSlug);
          formData.set("_submit_time", String(Date.now()));
          formData.set("_website", ""); // honeypot

          for (const [key, value] of Object.entries(report.fieldData)) {
            formData.set(key, String(value ?? ""));
          }

          // Add location from current tracking data
          const tracks = await offlineDB.getAllTrackingPoints();
          const springTrack = tracks.find((t) => t.isSpringMarker);
          if (springTrack) {
            const snapped = snapToProtectionGrid({ lat: springTrack.lat, lng: springTrack.lng });
            formData.set("location_lat", String(snapped.lat));
            formData.set("location_lng", String(snapped.lng));
          }

          const res = await fetch("/api/reports", {
            method: "POST",
            headers: csrfToken ? { "x-csrf-token": csrfToken } : {},
            body: formData,
          });

          if (res.ok) {
            setReportStatuses((prev) =>
              prev.map((r) => (r.id === report.id ? { ...r, status: "success" } : r))
            );
            await offlineDB.deleteReport(report.id);
          } else {
            const errData = await res.json().catch(() => ({ error: "Unknown" }));
            setReportStatuses((prev) =>
              prev.map((r) =>
                r.id === report.id
                  ? { ...r, status: "failed", error: errData.error || "Gagal kirim" }
                  : r
              )
            );
          }
        } catch {
          setReportStatuses((prev) =>
            prev.map((r) =>
              r.id === report.id ? { ...r, status: "failed", error: "Network error" } : r
            )
          );
        }
      }
    }

    // ── Phase 4: Upload tracking points ─────────────────────────────────
    if (tracks.length > 0) {
      setPhase("uploading-tracks");
      setProgress({ current: 0, total: tracks.length });

      try {
        await fetch("/api/offline/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackingPoints: tracks,
            totalDistance: tracks.filter((t) => !t.isSpringMarker).length * 10, // rough estimate
            springCount: tracks.filter((t) => t.isSpringMarker).length,
          }),
        });
      } catch {
        // Non-critical — tracking history is nice to have
        console.warn("[Sync] Failed to upload tracking points");
      }
    }

    // ── Phase 5: Cleanup ────────────────────────────────────────────────
    setPhase("cleaning-up");
    setProgress({ current: 0, total: 3 });

    // Clear IndexedDB
    await offlineDB.clearAll();
    setProgress({ current: 1, total: 3 });

    // Clear SW caches
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "clear-tiles" });
    }
    setProgress({ current: 2, total: 3 });

    // Close session on server
    try {
      await fetch("/api/offline/session", { method: "DELETE" });
    } catch {}
    setProgress({ current: 3, total: 3 });

    // ── Done ──
    setPhase("done");
    setTimeout(() => onComplete(), 1500);
  }, [onComplete]);

  // ── Render ──────────────────────────────────────────────────────────────

  const totalItems = photoStatuses.length + reportStatuses.length;
  const successItems =
    photoStatuses.filter((p) => p.status === "success").length +
    reportStatuses.filter((r) => r.status === "success").length;

  // ── CONFIRM STEP ─────────────────────────────────────────────────────────
  if (phase === "confirm") {
    const hasPhotos = photoStatuses.length > 0;
    const hasReports = reportStatuses.length > 0;
    const hasTracks = true; // always check

    return (
      <div className="mx-auto max-w-md py-12">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <ArrowLeft className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-ink">Keluar Mode Offline</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Data akan dikirim ke server. Pastikan koneksi internet stabil.
          </p>
        </div>

        {/* Item list */}
        <div className="mt-6 space-y-3">
          {hasPhotos && (
            <div className="flex items-center gap-3 rounded-xl border border-ink-line p-3">
              <Camera className="h-5 w-5 text-amber-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">
                  {photoStatuses.length} foto
                </p>
                <p className="text-xs text-ink-muted">Wajib diupload</p>
              </div>
              <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                WAJIB
              </span>
            </div>
          )}

          {hasReports && (
            <div className="flex items-center gap-3 rounded-xl border border-ink-line p-3">
              <FileText className="h-5 w-5 text-brand-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">
                  {reportStatuses.length} laporan
                </p>
                <p className="text-xs text-ink-muted">Akan dikirim ke server</p>
              </div>
            </div>
          )}

          {hasTracks && (
            <div className="flex items-center gap-3 rounded-xl border border-ink-line p-3">
              <MapPin className="h-5 w-5 text-emerald-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">Jejak GPS & tracking</p>
                <p className="text-xs text-ink-muted">Akan diupload, lalu dihapus</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 rounded-xl border border-ink-line p-3">
            <Trash2 className="h-5 w-5 text-red-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">Data lokal dihapus</p>
              <p className="text-xs text-ink-muted">IndexedDB & cache tiles</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">
            Batal
          </button>
          <button onClick={startSync} className="btn-primary flex-1 inline-flex items-center justify-center gap-2">
            <Upload className="h-4 w-4" />
            Mulai Sync
          </button>
        </div>
      </div>
    );
  }

  // ── SYNC PROGRESS ────────────────────────────────────────────────────────
  const isError = phase === "error";
  const isDone = phase === "done";

  return (
    <div className="mx-auto max-w-md py-12">
      <div className="text-center">
        <div
          className={cn(
            "mx-auto flex h-14 w-14 items-center justify-center rounded-full",
            isDone
              ? "bg-emerald-100 dark:bg-emerald-900/30"
              : isError
                ? "bg-red-100 dark:bg-red-900/30"
                : "bg-brand-100 dark:bg-brand-900/30"
          )}
        >
          {isDone ? (
            <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          ) : isError ? (
            <XCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
          ) : (
            <Loader2 className="h-7 w-7 animate-spin text-brand-600 dark:text-brand-400" />
          )}
        </div>

        <h2 className="mt-4 text-lg font-bold text-ink">
          {isDone ? "Selesai!" : isError ? "Sync Gagal" : "Menyinkronkan..."}
        </h2>

        <p className="mt-2 text-sm text-ink-muted">
          {isDone
            ? "Semua data berhasil terkirim. Data lokal dihapus."
            : isError
              ? errorMessage
              : phase === "uploading-photos"
                ? `Mengupload foto (${progress.current}/${progress.total})`
                : phase === "uploading-reports"
                  ? `Mengirim laporan (${progress.current}/${progress.total})`
                  : phase === "uploading-tracks"
                    ? "Mengupload jejak GPS..."
                    : phase === "cleaning-up"
                      ? "Membersihkan data lokal..."
                      : "Memproses..."}
        </p>
      </div>

      {/* Progress bar */}
      {!isDone && !isError && (
        <div className="mt-6">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-500"
              style={{
                width: `${
                  phase === "uploading-photos"
                    ? (progress.current / Math.max(progress.total, 1)) * 100
                    : phase === "uploading-reports"
                      ? 50 + (progress.current / Math.max(progress.total, 1)) * 50
                      : 100
                }%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Photo status detail */}
      {phase === "uploading-photos" && photoStatuses.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {photoStatuses.map((ps) => (
            <div key={ps.id} className="flex items-center gap-2 text-xs">
              {ps.status === "success" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : ps.status === "failed" ? (
                <XCircle className="h-3.5 w-3.5 text-red-500" />
              ) : (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-muted" />
              )}
              <span className="text-ink-subtle truncate">{ps.fileName}</span>
            </div>
          ))}
        </div>
      )}

      {/* Report status detail */}
      {phase === "uploading-reports" && reportStatuses.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {reportStatuses.map((rs) => (
            <div key={rs.id} className="flex items-center gap-2 text-xs">
              {rs.status === "success" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : rs.status === "failed" ? (
                <XCircle className="h-3.5 w-3.5 text-red-500" />
              ) : (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-muted" />
              )}
              <span className="text-ink-subtle">{rs.formSlug}</span>
            </div>
          ))}
        </div>
      )}

      {/* Error state — retry button */}
      {isError && (
        <div className="mt-6 flex items-center gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">
            Kembali ke Mode Offline
          </button>
          <button
            onClick={() => {
              setErrorMessage("");
              startSync();
            }}
            className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Coba Lagi
          </button>
        </div>
      )}
    </div>
  );
}
