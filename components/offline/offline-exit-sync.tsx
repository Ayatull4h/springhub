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
  Download,
  Footprints,
  Flag,
  Leaf,
  Mountain,
} from "lucide-react";
import { offlineDB, type OfflineTrackingPoint } from "@/lib/offline-db";
import { cn } from "@/lib/utils";
import { snapToProtectionGrid } from "@/lib/geo";

// ─── Types ──────────────────────────────────────────────────────────────────

type SyncPhase =
  | "confirm" // Review summary before exit
  | "uploading-photos" // Upload foto — fase WAJIB
  | "uploading-reports" // Upload forms ke /api/reports
  | "uploading-tracks" // Upload tracking points
  | "cleaning-up" // Hapus IndexedDB + cache
  | "done" // Selesai — tampilkan prompt cleanup
  | "error"; // Gagal — user tetap di mode offline

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

// ─── Helper: format distance ────────────────────────────────────────────────

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * OfflineExitSync — handles sync on exit from offline mode.
 *
 * Flow (revamped):
 * 1. Show full review summary (distance, markers, forms, photos, route)
 * 2. User can download a summary text file
 * 3. Upload FOTO (WAJIB) — if fails, STOP
 * 4. Send forms to /api/reports
 * 5. Send tracking points to /api/offline/sync
 * 6. Clear IndexedDB + cache tiles
 * 7. Show completion screen with cleanup prompt
 * 8. Call onComplete()
 */
export function OfflineExitSync({ onComplete, onCancel }: OfflineExitSyncProps) {
  const [phase, setPhase] = useState<SyncPhase>("confirm");
  const [photoStatuses, setPhotoStatuses] = useState<PhotoStatus[]>([]);
  const [reportStatuses, setReportStatuses] = useState<ReportStatus[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [errorMessage, setErrorMessage] = useState("");

  // Summary data
  const [summary, setSummary] = useState<{
    totalDistance: number;
    springCount: number;
    treeCount: number;
    trenchCount: number;
    seedlingCount: number;
    reportCount: number;
    photoCount: number;
    markerCount: number;
    trailCount: number;
    startTime: number | null;
  }>({
    totalDistance: 0,
    springCount: 0,
    treeCount: 0,
    trenchCount: 0,
    seedlingCount: 0,
    reportCount: 0,
    photoCount: 0,
    markerCount: 0,
    trailCount: 0,
    startTime: null,
  });

  // ── Load data on confirm ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "confirm") return;

    async function loadSummary() {
      const [tracks, photos, reports, config] = await Promise.all([
        offlineDB.getAllTrackingPoints(),
        offlineDB.getAllPhotos(),
        offlineDB.getAllReports(),
        offlineDB.getConfig(),
      ]);

      // Count markers by type
      const springCount = tracks.filter((t: OfflineTrackingPoint) => t.markerType === "spring").length;
      const treeCount = tracks.filter((t: OfflineTrackingPoint) => t.markerType === "tree").length;
      const trenchCount = tracks.filter((t: OfflineTrackingPoint) => t.markerType === "trench").length;
      const seedlingCount = tracks.filter((t: OfflineTrackingPoint) => t.markerType === "seedling").length;
      const trailCount = tracks.filter((t: OfflineTrackingPoint) => t.markerType === null).length;
      const markerCount = springCount + treeCount + trenchCount + seedlingCount;

      // Rough distance estimate from tracking points
      let totalDistance = 0;
      const trailPoints = tracks.filter((t: OfflineTrackingPoint) => t.markerType === null);
      for (let i = 1; i < trailPoints.length; i++) {
        const a = trailPoints[i - 1];
        const b = trailPoints[i];
        // Simple distance using flat approximation
        const dlat = (b.lat - a.lat) * 111320;
        const dlng = (b.lng - a.lng) * 111320 * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180));
        totalDistance += Math.sqrt(dlat * dlat + dlng * dlng);
      }

      setSummary({
        totalDistance,
        springCount,
        treeCount,
        trenchCount,
        seedlingCount,
        reportCount: reports.length,
        photoCount: photos.length,
        markerCount,
        trailCount,
        startTime: config?.startedAt ?? null,
      });

      setPhotoStatuses(
        photos.map((p) => ({
          id: p.id,
          fileName: p.fileName,
          status: "pending" as SyncItemStatus,
        }))
      );
      setReportStatuses(
        reports.map((r) => ({
          id: r.id,
          formSlug: r.formSlug,
          status: "pending" as SyncItemStatus,
        }))
      );
    }

    loadSummary();
  }, [phase]);

  // ── Download summary as text file ────────────────────────────────────────
  const handleDownloadSummary = useCallback(() => {
    const lines = [
      "===================================",
      "  SPRINGHUB — Ringkasan Survey",
      "===================================",
      "",
      `Waktu Mulai: ${summary.startTime ? new Date(summary.startTime).toLocaleString("id-ID") : "—"}`,
      `Total Jarak: ${formatDistance(summary.totalDistance)}`,
      "",
      "--- Marker ---",
      `💧 Mata Air: ${summary.springCount}`,
      `🌳 Tanam Pohon: ${summary.treeCount}`,
      `🕳️ Rorak: ${summary.trenchCount}`,
      `🌰 Seedling: ${summary.seedlingCount}`,
      `Total Marker: ${summary.markerCount}`,
      "",
      "--- Data ---",
      `Titik GPS: ${summary.trailCount}`,
      `Laporan: ${summary.reportCount}`,
      `Foto: ${summary.photoCount}`,
      "",
      "===================================",
      "  Dibuat oleh SpringHub",
      "  https://springhub.vercel.app",
      "===================================",
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `springhub-ringkasan-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [summary]);

  // ── Main sync function ───────────────────────────────────────────────────
  const startSync = useCallback(async () => {
    const photos = await offlineDB.getAllPhotos();
    const reports = await offlineDB.getAllReports();
    const tracks = await offlineDB.getAllTrackingPoints();

    // ── Phase 1: Upload photos (WAJIB berhasil) ─────────────────────────
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
                p.id === photo.id
                  ? { ...p, status: "failed", error: errBody.error || "Upload gagal" }
                  : p
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

    // ── Phase 2: Upload pending reports ─────────────────────────────────
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

          // Add location from tracking data (find first spring marker)
          const tracks = await offlineDB.getAllTrackingPoints();
          const springTrack = tracks.find((t: OfflineTrackingPoint) => t.markerType === "spring");
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

    // ── Phase 3: Upload tracking points ─────────────────────────────────
    if (tracks.length > 0) {
      setPhase("uploading-tracks");
      setProgress({ current: 0, total: tracks.length });

      try {
        const springCount = tracks.filter((t: OfflineTrackingPoint) => t.markerType === "spring").length;
        const treeCount = tracks.filter((t: OfflineTrackingPoint) => t.markerType === "tree").length;
        const trenchCount = tracks.filter((t: OfflineTrackingPoint) => t.markerType === "trench").length;
        const seedlingCount = tracks.filter((t: OfflineTrackingPoint) => t.markerType === "seedling").length;

        await fetch("/api/offline/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackingPoints: tracks,
            totalDistance: summary.totalDistance,
            springCount,
            treeCount,
            trenchCount,
            seedlingCount,
          }),
        });
      } catch {
        // Non-critical — tracking history is nice to have
        console.warn("[Sync] Failed to upload tracking points");
      }
    }

    // ── Phase 4: Cleanup ─────────────────────────────────────────────────
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

    // ── Done — show completion screen ──
    setPhase("done");
  }, [onComplete, summary.totalDistance]);

  // ── Render ──────────────────────────────────────────────────────────────

  const isError = phase === "error";
  const isDone = phase === "done";

  // ── CONFIRM STEP (Review Summary) ─────────────────────────────────────────
  if (phase === "confirm") {
    const hasMarkers = summary.markerCount > 0;
    const hasReports = summary.reportCount > 0;
    const hasPhotos = summary.photoCount > 0;

    return (
      <div className="mx-auto max-w-md py-8">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30">
            <Upload className="h-7 w-7 text-brand-600 dark:text-brand-400" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-ink">Ringkasan Survey</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Review data sebelum diupload ke server.
          </p>
        </div>

        {/* Stats grid */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-ink-line bg-white p-3 dark:bg-slate-800">
            <Footprints className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <div>
              <p className="text-xs text-ink-muted">Total Jarak</p>
              <p className="text-sm font-bold text-ink">{formatDistance(summary.totalDistance)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-ink-line bg-white p-3 dark:bg-slate-800">
            <MapPin className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-xs text-ink-muted">Titik GPS</p>
              <p className="text-sm font-bold text-ink">{summary.trailCount}</p>
            </div>
          </div>

          {summary.springCount > 0 && (
            <div className="flex items-center gap-2.5 rounded-xl border border-ink-line bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
              <Flag className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-300">Mata Air</p>
                <p className="text-sm font-bold text-ink">{summary.springCount}</p>
              </div>
            </div>
          )}

          {summary.treeCount > 0 && (
            <div className="flex items-center gap-2.5 rounded-xl border border-ink-line bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
              <Leaf className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-green-600 dark:text-green-300">Tanam Pohon</p>
                <p className="text-sm font-bold text-ink">{summary.treeCount}</p>
              </div>
            </div>
          )}

          {summary.trenchCount > 0 && (
            <div className="flex items-center gap-2.5 rounded-xl border border-ink-line bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
              <Mountain className="h-5 w-5 text-amber-700" />
              <div>
                <p className="text-xs text-amber-700 dark:text-amber-300">Rorak</p>
                <p className="text-sm font-bold text-ink">{summary.trenchCount}</p>
              </div>
            </div>
          )}

          {summary.seedlingCount > 0 && (
            <div className="flex items-center gap-2.5 rounded-xl border border-ink-line bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
              <Leaf className="h-5 w-5 text-emerald-700" />
              <div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">Seedling</p>
                <p className="text-sm font-bold text-ink">{summary.seedlingCount}</p>
              </div>
            </div>
          )}

          {hasReports && (
            <div className="flex items-center gap-2.5 rounded-xl border border-ink-line bg-white p-3 dark:bg-slate-800">
              <FileText className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <div>
                <p className="text-xs text-ink-muted">Laporan</p>
                <p className="text-sm font-bold text-ink">{summary.reportCount}</p>
              </div>
            </div>
          )}

          {hasPhotos && (
            <div className="flex items-center gap-2.5 rounded-xl border border-ink-line bg-white p-3 dark:bg-slate-800">
              <Camera className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-xs text-ink-muted">Foto</p>
                <p className="text-sm font-bold text-ink">{summary.photoCount}</p>
              </div>
            </div>
          )}
        </div>

        {/* Mini route summary */}
        <div className="mt-4 rounded-xl border border-ink-line bg-slate-50 p-3 dark:bg-slate-800">
          <h4 className="text-xs font-semibold uppercase text-ink-subtle">Ringkasan Route</h4>
          <div className="mt-1.5 space-y-1 text-xs text-ink-muted">
            <p>
              📍 {summary.markerCount} marker ({summary.springCount} 💧, {summary.treeCount} 🌱,{" "}
              {summary.trenchCount} 🕳️, {summary.seedlingCount} 🌰)
            </p>
            <p>🛤️ {summary.trailCount} titik GPS — {formatDistance(summary.totalDistance)}</p>
            <p>📸 {summary.photoCount} foto — {summary.reportCount} laporan</p>
            {summary.startTime && (
              <p>🕐 Mulai: {new Date(summary.startTime).toLocaleString("id-ID")}</p>
            )}
          </div>
        </div>

        {/* Data cleanup note */}
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-ink-line p-3">
          <Trash2 className="h-4 w-4 text-red-400" />
          <p className="text-xs text-ink-muted">
            Data lokal akan dihapus setelah berhasil sync.
          </p>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={handleDownloadSummary}
            className="btn-secondary w-full inline-flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            📥 Download Ringkasan
          </button>

          <div className="flex items-center gap-3">
            <button onClick={onCancel} className="btn-secondary flex-1">
              Batal
            </button>
            <button
              onClick={startSync}
              className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
            >
              <Upload className="h-4 w-4" />
              ☁️ Upload ke Server
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── SYNC PROGRESS ────────────────────────────────────────────────────────
  if (phase !== "done") {
    return (
      <div className="mx-auto max-w-md py-12">
        <div className="text-center">
          <div
            className={cn(
              "mx-auto flex h-14 w-14 items-center justify-center rounded-full",
              isError
                ? "bg-red-100 dark:bg-red-900/30"
                : "bg-brand-100 dark:bg-brand-900/30"
            )}
          >
            {isError ? (
              <XCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
            ) : (
              <Loader2 className="h-7 w-7 animate-spin text-brand-600 dark:text-brand-400" />
            )}
          </div>

          <h2 className="mt-4 text-lg font-bold text-ink">
            {isError ? "Sync Gagal" : "Menyinkronkan..."}
          </h2>

          <p className="mt-2 text-sm text-ink-muted">
            {isError
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
        {!isError && (
          <div className="mt-6">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-500"
                style={{
                  width: `${
                    phase === "uploading-photos"
                      ? (progress.current / Math.max(progress.total, 1)) * 50
                      : phase === "uploading-reports"
                        ? 50 + (progress.current / Math.max(progress.total, 1)) * 30
                        : phase === "uploading-tracks"
                          ? 80
                          : phase === "cleaning-up"
                            ? 80 + (progress.current / Math.max(progress.total, 1)) * 20
                            : 0
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
                <span className="truncate text-ink-subtle">{ps.fileName}</span>
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

  // ── DONE STEP (Completion with cleanup prompt) ────────────────────────────
  return (
    <div className="mx-auto max-w-md py-12">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-ink">Selesai! 🎉</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Semua data berhasil terkirim ke server. Data lokal telah dihapus.
        </p>
      </div>

      {/* Session stats */}
      <div className="mt-6 space-y-2 rounded-xl border border-ink-line bg-slate-50 p-4 dark:bg-slate-800">
        <h3 className="text-xs font-semibold uppercase text-ink-subtle">Sesi Selesai</h3>
        <div className="grid grid-cols-2 gap-2 text-xs text-ink-muted">
          <span>📍 {summary.markerCount} marker</span>
          <span>🛤️ {formatDistance(summary.totalDistance)}</span>
          <span>📸 {summary.photoCount} foto</span>
          <span>📋 {summary.reportCount} laporan</span>
          <span>🌰 {summary.seedlingCount} seedling</span>
        </div>
      </div>

      {/* Cleanup prompt */}
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
        <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
          🔄 Bersihkan Cache
        </h4>
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
          Data cache masih tersimpan di perangkat. Untuk menghemat penyimpanan, kamu bisa
          menghapus cache SpringHub di pengaturan browser, atau uninstall PWA jika tidak
          diperlukan lagi.
        </p>
        <ul className="mt-2 list-inside list-disc text-[11px] text-amber-600 dark:text-amber-400">
          <li>Android: Setelan &gt; Aplikasi &gt; SpringHub &gt; Hapus Cache</li>
          <li>iOS: Setelan &gt; Safari &gt; Hapus Data Website</li>
          <li>Desktop: Setelan &gt; Aplikasi &gt; SpringHub &gt; Hapus Data</li>
        </ul>
      </div>

      <button
        onClick={onComplete}
        className="btn-primary mt-6 w-full"
      >
        Selesai
      </button>
    </div>
  );
}
