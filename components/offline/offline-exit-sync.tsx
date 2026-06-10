"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Download,
  Footprints,
  Flag,
  Leaf,
  Mountain,
} from "lucide-react";
import { offlineDB, type OfflineTrackingPoint } from "@/lib/offline-db";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import dynamic from "next/dynamic";
import html2canvas from "html2canvas";

// ── Dynamic import untuk map preview di exit sync ─────────────────────────
const SurveyLeafletMap = dynamic(
  () => import("./survey-leaflet-map").then((m) => m.SurveyLeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-slate-100 text-sm text-ink-muted">
        Loading map...
      </div>
    ),
  }
);

// ─── Types ──────────────────────────────────────────────────────────────────

type SyncPhase =
  | "confirm" // Review summary before exit
  | "uploading-reports" // Upload forms ke /api/reports (DULUAN)
  | "uploading-photos" // Upload foto (WAJIB)
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
  const { t, locale } = useI18n();
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

  const summaryRef = useRef<HTMLDivElement>(null);
  const mapPreviewRef = useRef<HTMLDivElement>(null);

  // Data untuk map preview
  const [mapData, setMapData] = useState<{
    trackingPoints: OfflineTrackingPoint[];
    markers: OfflineTrackingPoint[];
    center: { lat: number; lng: number } | null;
  }>({ trackingPoints: [], markers: [], center: null });

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

      // Calculate map center from tracking points
      let center: { lat: number; lng: number } | null = null;
      if (tracks.length > 0) {
        const lats = tracks.map((t: OfflineTrackingPoint) => t.lat);
        const lngs = tracks.map((t: OfflineTrackingPoint) => t.lng);
        center = {
          lat: (Math.min(...lats) + Math.max(...lats)) / 2,
          lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
        };
      }
      setMapData({
        trackingPoints: tracks,
        markers: tracks.filter((t: OfflineTrackingPoint) => t.markerType !== null),
        center,
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

  // ── Download: text fallback if html2canvas fails ──────────────────────
  const downloadText = useCallback(() => {
    const dateStr = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    const lines = [
      "=== SpringHub — Ringkasan Survey ===",
      `Tanggal: ${dateStr}`,
      `Jarak: ${formatDistance(summary.totalDistance)}`,
      `Marker: 💧 ${summary.springCount}  🌱 ${summary.treeCount}  🕳️ ${summary.trenchCount}  🌰 ${summary.seedlingCount}`,
      `Laporan: ${summary.reportCount}`,
      `Foto: ${summary.photoCount}`,
      "",
      "SpringHub — Jaga Semesta",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `springhub-rute-${Date.now()}.txt`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [summary]);

  // ── Download: capture Leaflet map preview + overlay stats ───────────────
  const handleDownloadSummary = useCallback(async () => {
    const mapEl = mapPreviewRef.current;
    if (!mapEl) { downloadText(); return; }

    try {
      await new Promise((r) => setTimeout(r, 500));

      const canvas = await html2canvas(mapEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        height: mapEl.scrollHeight,
        width: mapEl.scrollWidth,
      });

      // Overlay teks stats di canvas
      const overlay = document.createElement("canvas");
      overlay.width = canvas.width;
      overlay.height = canvas.height;
      const ctx = overlay.getContext("2d")!;
      ctx.drawImage(canvas, 0, 0);

      // Panel info bawah
      const pH = 80;
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.fillRect(0, overlay.height - pH, overlay.width, pH);

      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.round(18 * 2)}px sans-serif`;
      ctx.fillText("📊 SpringHub — Ringkasan Survey", 20 * 2, overlay.height - pH + 28 * 2);

      ctx.font = `${Math.round(13 * 2)}px sans-serif`;
      const dateStr = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
      const infoLine = `📍 ${formatDistance(summary.totalDistance)}  |  💧 ${summary.springCount}  🌱 ${summary.treeCount}  🕳️ ${summary.trenchCount}  🌰 ${summary.seedlingCount}  |  📋 ${summary.reportCount} laporan  📸 ${summary.photoCount} foto  |  🕐 ${dateStr}`;
      ctx.fillText(infoLine, 20 * 2, overlay.height - pH + 54 * 2);

      // Watermark
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.font = `${Math.round(11 * 2)}px sans-serif`;
      ctx.fillText("SpringHub — Jaga Semesta", overlay.width - 200 * 2, overlay.height - 12 * 2);

      overlay.toBlob((blob) => {
        if (!blob) { downloadText(); return; }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `springhub-rute-${Date.now()}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch (err) {
      console.error("[Download] Failed, using text fallback:", err);
      downloadText();
    }
  }, [summary, downloadText]);

  // ── Helper: get CSRF token ──────────────────────────────────────────────
  async function getCsrfToken(): Promise<string> {
    try {
      const res = await fetch("/api/csrf");
      const data = await res.json();
      return data.token || "";
    } catch {
      return "";
    }
  }

  // ── Main sync function ───────────────────────────────────────────────────
  const startSync = useCallback(async () => {
    // Check network first
    if (!navigator.onLine) {
      setErrorMessage("Kamu sedang offline. Data akan tersimpan dan bisa diupload nanti saat online kembali.");
      setPhase("error");
      return;
    }

    const photos = await offlineDB.getAllPhotos();
    const reports = await offlineDB.getAllReports();

    // Map: clientReportId → serverReportId
    const reportIdMap = new Map<string, string>();

    // ── Phase 1: Upload pending reports (DULUAN) ─────────────────────────
    if (reports.length > 0) {
      setPhase("uploading-reports");
      setProgress({ current: 0, total: reports.length });

      for (let i = 0; i < reports.length; i++) {
        const report = reports[i];
        setProgress({ current: i + 1, total: reports.length });

        try {
          const csrfToken = await getCsrfToken();

          const formData = new FormData();
          formData.set("form_slug", report.formSlug);
          formData.set("_submit_time", String(Date.now()));
          formData.set("_website", ""); // honeypot

          for (const [key, value] of Object.entries(report.fieldData)) {
            formData.set(key, String(value ?? ""));
          }

          const res = await fetch("/api/reports", {
            method: "POST",
            headers: csrfToken ? { "x-csrf-token": csrfToken } : {},
            body: formData,
          });

          if (res.ok) {
            const result = await res.json();
            const serverReportId: string = result.report?.id;
            if (serverReportId) {
              reportIdMap.set(report.id, serverReportId);
            }
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
            // Non-fatal — continue to next report
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

    // ── Phase 2: Upload photos (WAJIB) — dengan server reportId ──────────
    if (photos.length > 0) {
      setPhase("uploading-photos");
      setProgress({ current: 0, total: photos.length });
      const csrfToken = await getCsrfToken();

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        setProgress({ current: i + 1, total: photos.length });

        // Map client reportId → server reportId
        const serverReportId = reportIdMap.get(photo.reportId) || photo.reportId;

        try {
          // Re-create blob from ArrayBuffer to prevent Chrome Android IndexedDB blob detachment
          let photoBlob = photo.blob;
          // Jika blob type kosong, baca sebagai ArrayBuffer dan buat baru
          if (!photoBlob.type || photoBlob.type === "" || photoBlob.size === 0) {
            try {
              const buf = await photoBlob.arrayBuffer();
              photoBlob = new Blob([buf], { type: "image/jpeg" });
            } catch {
              // Jika blob benar-benar detached, skip foto ini
              setPhotoStatuses((prev) =>
                prev.map((p) =>
                  p.id === photo.id ? { ...p, status: "failed", error: "Blob tidak terbaca" } : p
                )
              );
              setErrorMessage(`Foto ${photo.fileName} rusak dan tidak bisa diupload.`);
              setPhase("error");
              return;
            }
          }

          const formData = new FormData();
          formData.append("photo", photoBlob, photo.fileName);
          formData.append("field_id", photo.fieldId);

          const res = await fetch(`/api/reports/${serverReportId}/photos`, {
            method: "POST",
            headers: csrfToken ? { "x-csrf-token": csrfToken } : {},
            body: formData,
            signal: AbortSignal.timeout(30_000),
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
            return; // STOP — foto gagal = tidak bisa keluar
          }
        } catch (err) {
          setPhotoStatuses((prev) =>
            prev.map((p) =>
              p.id === photo.id ? { ...p, status: "failed", error: "Network error" } : p
            )
          );
          setErrorMessage(`Gagal upload foto ${photo.fileName}. Koneksi tidak stabil.`);
          setPhase("error");
          return; // STOP
        }
      }
    }

    // ── Phase 3: Cleanup ─────────────────────────────────────────────────
    setPhase("cleaning-up");
    setProgress({ current: 0, total: 3 });

    await offlineDB.clearAll();
    setProgress({ current: 1, total: 3 });

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "clear-tiles" });
    }
    setProgress({ current: 2, total: 3 });

    try {
      await fetch("/api/offline/session", { method: "DELETE" });
    } catch {}
    setProgress({ current: 3, total: 3 });

    setPhase("done");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
          <h2 className="mt-4 text-lg font-bold text-ink">{t("offline.reviewTitle")}</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {t("offline.reviewDesc") || "Review data sebelum diupload ke server."}
          </p>
        </div>

        <div ref={summaryRef} className="bg-white p-4 rounded-xl">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-ink-line bg-white p-3 dark:bg-slate-800">
              <Footprints className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <div>
                <p className="text-xs text-ink-muted">{t("offline.totalDistance")}</p>
                <p className="text-sm font-bold text-ink">{formatDistance(summary.totalDistance)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-ink-line bg-white p-3 dark:bg-slate-800">
              <MapPin className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-xs text-ink-muted">{t("offline.gpsPoints") || "Titik GPS"}</p>
                <p className="text-sm font-bold text-ink">{summary.trailCount}</p>
              </div>
            </div>

            {summary.springCount > 0 && (
              <div className="flex items-center gap-2.5 rounded-xl border border-ink-line bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                <Flag className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xs text-blue-600 dark:text-blue-300">{t("offline.springs")}</p>
                  <p className="text-sm font-bold text-ink">{summary.springCount}</p>
                </div>
              </div>
            )}

            {summary.treeCount > 0 && (
              <div className="flex items-center gap-2.5 rounded-xl border border-ink-line bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                <Leaf className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-xs text-green-600 dark:text-green-300">{t("offline.trees")}</p>
                  <p className="text-sm font-bold text-ink">{summary.treeCount}</p>
                </div>
              </div>
            )}

            {summary.trenchCount > 0 && (
              <div className="flex items-center gap-2.5 rounded-xl border border-ink-line bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                <Mountain className="h-5 w-5 text-amber-700" />
                <div>
                  <p className="text-xs text-amber-700 dark:text-amber-300">{t("offline.trenches")}</p>
                  <p className="text-sm font-bold text-ink">{summary.trenchCount}</p>
                </div>
              </div>
            )}

            {summary.seedlingCount > 0 && (
              <div className="flex items-center gap-2.5 rounded-xl border border-ink-line bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
                <Leaf className="h-5 w-5 text-emerald-700" />
                <div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">{t("offline.seedlings")}</p>
                  <p className="text-sm font-bold text-ink">{summary.seedlingCount}</p>
                </div>
              </div>
            )}

            {hasReports && (
              <div className="flex items-center gap-2.5 rounded-xl border border-ink-line bg-white p-3 dark:bg-slate-800">
                <FileText className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                <div>
                  <p className="text-xs text-ink-muted">{t("offline.totalForms")}</p>
                  <p className="text-sm font-bold text-ink">{summary.reportCount}</p>
                </div>
              </div>
            )}

            {hasPhotos && (
              <div className="flex items-center gap-2.5 rounded-xl border border-ink-line bg-white p-3 dark:bg-slate-800">
                <Camera className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-xs text-ink-muted">{t("offline.totalPhotos")}</p>
                  <p className="text-sm font-bold text-ink">{summary.photoCount}</p>
                </div>
              </div>
            )}
          </div>

          {/* Mini route summary */}
          <div className="mt-4 rounded-xl border border-ink-line bg-slate-50 p-3 dark:bg-slate-800">
            <h4 className="text-xs font-semibold uppercase text-ink-subtle">{t("offline.routeSummary") || "Ringkasan Route"}</h4>
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
              {t("offline.sync.clear")}
            </p>
          </div>
        </div>

        {/* ── Map Preview ── */}
        {mapData.trackingPoints.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-xl border border-ink-line">
            <div ref={mapPreviewRef} className="h-[400px] w-full">
              <SurveyLeafletMap
                trackingPoints={mapData.trackingPoints}
                markers={mapData.markers}
                currentPosition={null}
                isTracking={false}
                initialCenter={mapData.center}
                focusMarker={null}
                autoFollowPaused={true}
              />
            </div>
            <div className="border-t border-ink-line bg-slate-50 px-4 py-2 text-xs text-ink-muted dark:bg-slate-800">
              Peta pratinjau — akan tersimpan di gambar saat download
            </div>
          </div>
        )}

        {/* Action buttons — 2 download options */}
        <div className="mt-6 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={downloadText}
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              📄 Track Saja
            </button>
            <button
              onClick={handleDownloadSummary}
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              🗺️ Track + Map
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={onCancel} className="btn-secondary flex-1">
              {t("common.cancel")}
            </button>
            <button
              onClick={startSync}
              className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {t("offline.uploadData")}
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
            {isError ? t("offline.syncFailed") || "Sync Gagal" : t("offline.sync.syncing") || "Menyinkronkan..."}
          </h2>

          <p className="mt-2 text-sm text-ink-muted">
            {isError
              ? errorMessage
              : phase === "uploading-photos"
                ? `${t("offline.uploadProgress")} (${progress.current}/${progress.total})`
                  : phase === "uploading-reports"
                    ? `${t("offline.syncingReports") || "Mengirim laporan"} (${progress.current}/${progress.total})`
                    : phase === "cleaning-up"
                      ? t("offline.sync.cleaning") || "Membersihkan data lokal..."
                      : t("offline.processing") || "Memproses..."}
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
                        ? 50 + (progress.current / Math.max(progress.total, 1)) * 50
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
          <div className="mt-6 space-y-3">
            {/* Online status indicator */}
            {!navigator.onLine && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                📡 Kamu sedang offline. Data tetap aman di perangkat.
                Akan terkirim otomatis saat online.
              </div>
            )}
            <div className="flex items-center gap-3">
              <button onClick={onCancel} className="btn-secondary flex-1">
                {t("offline.sync.back")}
              </button>
              <button
                onClick={() => {
                  if (!navigator.onLine) {
                    alert("Kamu masih offline. Sambungkan ke internet lalu coba lagi.");
                    return;
                  }
                  setErrorMessage("");
                  startSync();
                }}
                className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {t("offline.sync.retry")}
              </button>
            </div>
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
        <h2 className="mt-4 text-xl font-bold text-ink">{t("offline.sync.done")} 🎉</h2>
        <p className="mt-2 text-sm text-ink-muted">
          {t("offline.syncDoneDesc") || "Semua data berhasil terkirim ke server. Data lokal telah dihapus."}
        </p>
      </div>

      {/* Session stats */}
      <div className="mt-6 space-y-2 rounded-xl border border-ink-line bg-slate-50 p-4 dark:bg-slate-800">
        <h3 className="text-xs font-semibold uppercase text-ink-subtle">{t("offline.sessionEnded") || "Sesi Selesai"}</h3>
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
          {t("offline.clearCache") || "Bersihkan Cache"}
        </h4>
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
          {t("offline.clearCacheDesc") || "Data cache masih tersimpan di perangkat. Untuk menghemat penyimpanan, kamu bisa menghapus cache SpringHub di pengaturan browser, atau uninstall PWA jika tidak diperlukan lagi."}
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
        {t("common.done")}
      </button>
    </div>
  );
}
