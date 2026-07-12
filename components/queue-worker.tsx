"use client";
import { useEffect, useRef } from "react";
import { offlineDB, type QueuedSubmission } from "@/lib/offline-db";
import { useToast } from "@/components/toast";

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

  /** Helper: fetch CSRF token — retry 3x kalo gagal */
  async function getCsrfToken(): Promise<string> {
    for (let i = 0; i < 3; i++) {
      try {
        const res = await fetch("/api/csrf", { signal: AbortSignal.timeout(5000) });
        const data = await res.json();
        if (data.token) return data.token;
      } catch {
        if (i === 2) return "";
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    return "";
  }

  /** Helper: submit satu item dari queue ke server */
  async function submitQueueItem(item: QueuedSubmission): Promise<boolean> {
    const csrfToken = await getCsrfToken();
    if (!csrfToken) return false;

    try {
      const formData = new FormData();
      formData.set("form_slug", item.formSlug);
      formData.set("_captured_at", (item.fieldData._captured_at as string) || new Date().toISOString());
      formData.set("_submit_time", String(Date.now()));
      formData.set("_website", "");
      for (const [key, value] of Object.entries(item.fieldData)) {
        if (key === "_captured_at") continue;
        formData.set(key, String(value ?? ""));
      }

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "x-csrf-token": csrfToken },
        body: formData,
      });

      if (!res.ok) return false;

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
              headers: photoCsrf ? { "x-csrf-token": photoCsrf } : {},
              body: photoPayload,
              signal: AbortSignal.timeout(30_000),
            });
          } catch {
            // Photo gagal — report sudah tersimpan, foto bisa diupload manual
          }
        }
      }

      // Bersihin pending-reports / drafts yg mungkin tersisa (pakai item.id yg sama)
      try { await offlineDB.deleteReport(item.id); } catch {}
      try { await offlineDB.deleteDraft(item.id); } catch {}

      return true;
    } catch {
      return false;
    }
  }

  /** Helper: proses submission-queue + pending-reports */
  async function processAllQueues() {
    // Proses submission-queue dulu
    const queue = await offlineDB.getAllQueued();
    let successCount = 0;

    for (const item of queue) {
      const ok = await submitQueueItem(item);
      if (ok) {
        await offlineDB.deleteQueued(item.id);
        successCount++;
      } else {
        // Retry: update retryCount in place — queueSubmission upsert (sama key),
        // jadi TIDAK usah deleteQueued agar item tetap di queue.
        const updatedRetry = (item.retryCount || 0) + 1;
        item.retryCount = updatedRetry;
        await offlineDB.queueSubmission(item);
        if (updatedRetry >= MAX_RETRIES) {
          console.warn(`[QueueWorker] Item ${item.id} gagal ${MAX_RETRIES}x, tetap disimpan di queue untuk retry manual.`);
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

      const ok = await submitQueueItem(queueItem);
      if (ok) {
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
        const queue = await offlineDB.getAllQueued();
        if (queue.length === 0) {
          // Cek pending-reports sekalian
          const pending = await offlineDB.getAllReports();
          if (pending.length === 0) return;
        }

        toast(`Menyinkronkan laporan offline...`, "info");
        const successCount = await processAllQueues();

        if (successCount > 0) {
          // Bersihin tracking points lama setelah sukses
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
        }
      } catch {
        // Silently fail — will retry when online event fires
      } finally {
        processingRef.current = false;
      }
    };

    // Jalankan cleanup stale dulu, baru process queue
    cleanupStale().finally(() => processQueue());

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
