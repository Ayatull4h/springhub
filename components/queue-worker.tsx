"use client";
import { useEffect, useRef } from "react";
import { offlineDB } from "@/lib/offline-db";
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

  /** Helper: fetch CSRF token */
  async function getCsrfToken(): Promise<string> {
    try {
      const res = await fetch("/api/csrf");
      const data = await res.json();
      return data.token || "";
    } catch {
      return "";
    }
  }

  useEffect(() => {
    const processQueue = async () => {
      if (processingRef.current) return;
      processingRef.current = true;
      try {
        // ── Ambil CSRF token fresh ────────────────────────────────
        const freshCsrfToken = await getCsrfToken();
        if (!freshCsrfToken) {
          // CSRF token not available, retry later
          processingRef.current = false;
          return;
        }

        const queue = await offlineDB.getAllQueued();
        if (queue.length === 0) return;

        toast(`Menyinkronkan ${queue.length} laporan offline...`, "info");
        let successCount = 0;

        for (const item of queue) {
          try {
            const formData = new FormData();
            formData.set("form_slug", item.formSlug);
            formData.set("_captured_at", (item.fieldData._captured_at as string) || new Date().toISOString());
            for (const [key, value] of Object.entries(item.fieldData)) {
              if (key === "_captured_at") continue;
              formData.set(key, String(value ?? ""));
            }

            if (item.photoBlobs && item.photoBlobs.length > 0) {
              for (const pb of item.photoBlobs) {
                const blob = pb.blob instanceof Blob ? pb.blob : new Blob([pb.blob], { type: pb.mimeType || "image/jpeg" });
                formData.append(pb.fieldId, blob, pb.fileName || `photo-${Date.now()}.jpg`);
              }
            }

            const res = await fetch("/api/reports", {
              method: "POST",
              headers: { "x-csrf-token": freshCsrfToken },
              body: formData,
            });

            if (res.ok) {
              const data = await res.json();

              if (data.report?.id && item.photoBlobs && item.photoBlobs.length > 0) {
                const reportId = data.report.id;
                const photoErrors: string[] = [];

                for (const pb of item.photoBlobs) {
                  try {
                    const blob = pb.blob instanceof Blob ? pb.blob : new Blob([pb.blob], { type: pb.mimeType || "image/jpeg" });
                    const photoPayload = new FormData();
                    photoPayload.append("photo", blob, pb.fileName || `photo-${Date.now()}.jpg`);
                    photoPayload.append("field_id", pb.fieldId);

                    const photoRes = await fetch(`/api/reports/${reportId}/photos`, {
                      method: "POST",
                      body: photoPayload,
                    });

                    if (!photoRes.ok) {
                      photoErrors.push(`Foto ${pb.fileName || "unknown"} gagal`);
                    }
                  } catch {
                    photoErrors.push(`Foto ${pb.fileName || "unknown"} gagal — cek koneksi`);
                  }
                }

                if (photoErrors.length > 0 && photoErrors.length === item.photoBlobs.length) {
                  item.retryCount = (item.retryCount || 0) + 1;
                  if (item.retryCount < MAX_RETRIES) {
                    await offlineDB.queueSubmission(item);
                    await offlineDB.deleteQueued(item.id);
                    continue;
                  }
                  await offlineDB.deleteQueued(item.id);
                  continue;
                }
              }

              await offlineDB.deleteQueued(item.id);
              successCount++;

              // ── Bersihin data terkait dari store lain ──
              try {
                await offlineDB.deleteReport(item.id);
                await offlineDB.deleteDraft(item.id);
              } catch { /* non-critical */ }

              try {
                await fetch("/api/notifications", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    type: "submission-sent",
                    title: "Laporan terkirim!",
                    body: `Laporan ${item.formSlug} berhasil dikirim.`,
                  }),
                });
              } catch { /* ignore notification errors */ }
            } else {
              item.retryCount = (item.retryCount || 0) + 1;
              if (item.retryCount < MAX_RETRIES) {
                await offlineDB.queueSubmission(item);
                await offlineDB.deleteQueued(item.id);
                continue;
              }
              await offlineDB.deleteQueued(item.id);
            }
          } catch {
            item.retryCount = (item.retryCount || 0) + 1;
            if (item.retryCount < MAX_RETRIES) {
              await offlineDB.queueSubmission(item);
              await offlineDB.deleteQueued(item.id);
              continue;
            }
            await offlineDB.deleteQueued(item.id);
          }
        }

        if (successCount > 0) {
          // Bersihin semua store pendukung setelah sukses
          try {
            const tracks = await offlineDB.getAllTrackingPoints();
            if (tracks.length > 0) {
              const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
              for (const t of tracks) {
                if (t.recordedAt < dayAgo) await offlineDB.deleteTrackingPoint(t.id);
              }
            }
          } catch { /* non-critical */ }

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
