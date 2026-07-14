"use client";
import { useEffect, useRef } from "react";
import { offlineDB, type QueuedSubmission } from "@/lib/offline-db";
import { useToast } from "@/components/toast";

const SW_VERSION = "2026-07-12-v5"; // Bump this when SW changes — user perlu reopen PWA
const MAX_RETRIES = 5;
const POLL_INTERVAL_MS = 10_000;
const STALE_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

export function QueueWorker() {
  const { toast } = useToast();
  const processingRef = useRef(false);

  /** Hapus item stale yang lebih dari 7 hari dari semua store */
  async function cleanupStale() {
    try {
      const cutoff = Date.now() - STALE_AGE_MS;

      // Bersihin draft-reports lama
      const drafts = await offlineDB.getAllDrafts();
      for (const d of drafts) {
        if (d.savedAt < cutoff) await offlineDB.deleteDraft(d.id);
      }

      // Bersihin pending-reports lama
      const pending = await offlineDB.getAllReports();
      for (const p of pending) {
        if (p.createdAt < cutoff) await offlineDB.deleteReport(p.id);
      }

      // Bersihin tracking-points lama (GPS trails)
      const tracks = await offlineDB.getAllTrackingPoints();
      for (const t of tracks) {
        if (t.recordedAt < cutoff) await offlineDB.deleteTrackingPoint(t.id);
      }

      // Bersihin submission-queue yang stuck >7 hari
      const queue = await offlineDB.getAllQueued();
      for (const q of queue) {
        if (q.createdAt < cutoff) await offlineDB.deleteQueued(q.id);
      }
    } catch {
      // Silent — cleanup gagal tidak kritis
    }
  }

  /** Helper: fetch CSRF token — retry 3x kalo gagal, pake AbortController manual biar kompatibel browser lawas */
  async function getCsrfToken(): Promise<string> {
    for (let i = 0; i < 3; i++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch("/api/csrf", { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        if (data.token) return data.token;
      } catch (err) {
        clearTimeout(timeoutId);
        if (i === 2) {
          console.error("[QueueWorker] CSRF fetch failed after 3 retries:", err);
          return "";
        }
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    return "";
  }

  /** Helper: submit satu item dari queue ke server — return { ok, error? } */
  async function submitQueueItem(item: QueuedSubmission): Promise<{ ok: boolean; error?: string }> {
    // Coba dapetin CSRF token (best-effort — server bypass pake x-queue-worker kalo gak ada)
    const csrfToken = await getCsrfToken();

    try {
      const formData = new FormData();
      formData.set("form_slug", item.formSlug);
      formData.set("_captured_at", (item.fieldData._captured_at as string) || new Date().toISOString());
      formData.set("_submit_time", String(Date.now() - 10000));
      formData.set("_website", "");
      for (const [key, value] of Object.entries(item.fieldData)) {
        if (key === "_captured_at" || key === "_submit_time") continue;
        formData.set(key, String(value ?? ""));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      let res: Response;
      try {
        res = await fetch("/api/reports", {
          method: "POST",
          headers: {
            ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
            "x-queue-worker": "true",
          },
          body: formData,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!res.ok) {
        let errBody = "";
        try { const e = await res.json(); errBody = e.error || JSON.stringify(e); } catch { errBody = `HTTP ${res.status}`; }
        console.error(`[QueueWorker] API ${res.status} for ${item.id}:`, errBody);
        return { ok: false, error: errBody };
      }

      const data = await res.json();

      // Upload photos AFTER report sukses
      if (data.report?.id && item.photoBlobs?.length > 0) {
        const reportId = data.report.id;
        for (const pb of item.photoBlobs) {
          try {
            const photoCsrf = await getCsrfToken();
            const blob = pb.blob instanceof Blob ? pb.blob : new Blob([pb.blob], { type: pb.mimeType || "image/jpeg" });
            const photoPayload = new FormData();
            photoPayload.append("photo", blob, pb.fileName || `photo-${Date.now()}.jpg`);
            photoPayload.append("field_id", pb.fieldId);

            await fetch(`/api/reports/${reportId}/photos`, {
              method: "POST",
              headers: { ...(photoCsrf ? { "x-csrf-token": photoCsrf } : {}), "x-queue-worker": "true" },
              body: photoPayload,
              signal: (() => { const c = new AbortController(); setTimeout(() => c.abort(), 30000); return c.signal; })(),
            });
          } catch {
            // Photo gagal — report sudah tersimpan, foto bisa diupload manual
          }
        }
      }

      // Bersihin pending-reports / drafts yg mungkin tersisa (pakai item.id yg sama)
      try { await offlineDB.deleteReport(item.id); } catch {}
      try { await offlineDB.deleteDraft(item.id); } catch {}

      return { ok: true };
    } catch (err) {
      console.error("[QueueWorker] Network error submitting", item.id, err);
      return { ok: false, error: err instanceof Error ? err.message : "Network error" };
    }
  }

  /** Helper: proses submission-queue + pending-reports */
  async function processAllQueues() {
    // Proses submission-queue dulu
    const queue = await offlineDB.getAllQueued();
    let successCount = 0;

    for (const item of queue) {
      const result = await submitQueueItem(item);
      if (result.ok) {
        await offlineDB.deleteQueued(item.id);
        successCount++;
      } else {
        const updatedRetry = (item.retryCount || 0) + 1;
        item.retryCount = updatedRetry;
        item.lastError = result.error;
        await offlineDB.queueSubmission(item);
        if (updatedRetry >= MAX_RETRIES) {
          console.warn(`[QueueWorker] Item ${item.id} gagal ${MAX_RETRIES}x: ${result.error}. Tetap disimpan.`);
        }
      }
    }

    // Juga proses pending-reports (dari OfflineSurveyMap)
    const pending = await offlineDB.getAllReports();
    for (const report of pending) {
      const queueItem: QueuedSubmission = {
        id: report.id,
        formSlug: report.formSlug,
        fieldData: report.fieldData as Record<string, unknown>,
        photoBlobs: [],
        csrfToken: "",
        createdAt: report.createdAt,
        retryCount: 0,
      };

      // Ambil foto dari photo-blobs yang related
      try {
        const photos = await offlineDB.getPhotosByReport(report.id);
        for (const p of photos) {
          queueItem.photoBlobs.push({
            fieldId: p.fieldId,
            blob: p.blob,
            fileName: p.fileName,
            mimeType: p.mimeType,
          });
        }
      } catch {}

      const result = await submitQueueItem(queueItem);
      if (result.ok) {
        await offlineDB.deleteReport(report.id);
        successCount++;
      }
    }

    return successCount;
  }

  useEffect(() => {
    const processQueue = async () => { // eslint-disable-line react-hooks/exhaustive-deps
      if (processingRef.current) return;
      processingRef.current = true;
      try {
        // Jangan sync kalo offline — tunggu online event
        if (!navigator.onLine) return;

        const queue = await offlineDB.getAllQueued();
        if (queue.length === 0) {
          const pending = await offlineDB.getAllReports();
          if (pending.length === 0) return;
        }

        toast(`Menyinkronkan laporan offline...`, "info");
        const successCount = await processAllQueues();

        // Cek apakah masih ada item yg gagal
        const remainingQueued = await offlineDB.getAllQueued();
        const failedCount = remainingQueued.length;

        if (successCount > 0 && failedCount === 0) {
          try {
            const tracks = await offlineDB.getAllTrackingPoints();
            if (tracks.length > 0) {
              const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
              for (const t of tracks) {
                if (t.recordedAt < dayAgo) await offlineDB.deleteTrackingPoint(t.id);
              }
            }
          } catch {}
          toast(`${successCount} laporan offline berhasil dikirim!`, "success");
        } else if (successCount > 0 && failedCount > 0) {
          toast(`${successCount} terkirim, ${failedCount} gagal (akan dicoba lagi)`, "info");
        } else if (failedCount > 0) {
          const oldest = remainingQueued[0];
          toast(`Gagal sinkron (${failedCount} antrean, retry ${oldest.retryCount}/${MAX_RETRIES})`, "error");
          console.error("[QueueWorker] Failed queue items:", remainingQueued.map(i => ({ id: i.id, slug: i.formSlug, retry: i.retryCount })));
        }
        // Simpan status ke localStorage biar kelihatan di HP
        if (failedCount > 0) {
          const oldest = remainingQueued[0];
          const errMsg = oldest.lastError ? ` — ${oldest.lastError}` : "";
          const statusMsg = `Gagal: ${oldest.formSlug} (retry ${oldest.retryCount}/${MAX_RETRIES})${errMsg}`;
          offlineDB.saveSyncStatus({ ok: false, message: statusMsg, time: Date.now() });
        } else {
          offlineDB.clearSyncStatus();
        }

        if (failedCount > 0) {
          for (const item of remainingQueued) {
            console.error(`[QueueWorker] Masih gagal: ${item.formSlug} (${item.retryCount}x) error: ${item.lastError || "?"}`);
          }
        }
      } catch (err) {
        console.error("[QueueWorker] Unexpected error:", err);
        offlineDB.saveSyncStatus({ ok: false, message: `Error: ${err instanceof Error ? err.message : "unknown"}`, time: Date.now() });
      } finally {
        processingRef.current = false;
      }
    };

    // ── Simpan versi code ke localStorage — biar bisa cek user pake code terbaru ──
    try { localStorage.setItem("sw_version", SW_VERSION); } catch {}

    // ── Cek update service worker ──
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        // Check for SW updates every 60 seconds
        setInterval(() => { reg.update(); }, 60000);
        // If waiting, activate immediately
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      }).catch(() => {});
    }

    // ── Sync pertama jalan — delay 2 detik biar page stabil dulu ──
    cleanupStale().finally(() => setTimeout(processQueue, 2000));

    const handleOnline = () => { processQueue(); };
    window.addEventListener("online", handleOnline);

    const interval = setInterval(processQueue, POLL_INTERVAL_MS);

    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(interval);
    };
  }, [toast]);

  return null;
}
