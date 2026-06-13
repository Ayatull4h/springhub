"use client";
import { useEffect } from "react";
import { offlineDB } from "@/lib/offline-db";

/**
 * QueueWorker — processes the offline submission queue
 * when the app detects it's online.
 *
 * Handles both report submission AND photo upload.
 */
export function QueueWorker() {
  useEffect(() => {
    const processQueue = async () => {
      try {
        const queue = await offlineDB.getAllQueued();
        if (queue.length === 0) return;

        for (const item of queue) {
          try {
            const formData = new FormData();
            formData.set("form_slug", item.formSlug);
            formData.set("_captured_at", item.fieldData._captured_at as string || new Date().toISOString());
            for (const [key, value] of Object.entries(item.fieldData)) {
              if (key === "_captured_at") continue;
              formData.set(key, String(value ?? ""));
            }

            // Re-attach photo blobs to formData
            if (item.photoBlobs && item.photoBlobs.length > 0) {
              for (const pb of item.photoBlobs) {
                const blob = pb.blob instanceof Blob ? pb.blob : new Blob([pb.blob], { type: pb.mimeType || "image/jpeg" });
                formData.append(pb.fieldId, blob, pb.fileName || `photo-${Date.now()}.jpg`);
              }
            }

            const res = await fetch("/api/reports", {
              method: "POST",
              headers: item.csrfToken ? { "x-csrf-token": item.csrfToken } : {},
              body: formData,
            });

            if (res.ok) {
              const data = await res.json();

              // Upload photos to the created report
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

                // If photos failed, save back to queue for retry
                if (photoErrors.length > 0 && photoErrors.length === item.photoBlobs.length) {
                  item.retryCount++;
                  if (item.retryCount < 5) {
                    await offlineDB.queueSubmission(item);
                  }
                  await offlineDB.deleteQueued(item.id);
                  continue;
                }
              }

              await offlineDB.deleteQueued(item.id);
              // Notify user
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
              item.retryCount++;
              if (item.retryCount < 5) {
                await offlineDB.queueSubmission(item);
              }
              await offlineDB.deleteQueued(item.id);
            }
          } catch {
            item.retryCount++;
            if (item.retryCount < 5) {
              await offlineDB.queueSubmission(item);
            }
            await offlineDB.deleteQueued(item.id);
          }
        }
      } catch {
        // Silently fail — will retry when online event fires
      }
    };

    // Check on mount
    processQueue();

    // Check when we come back online
    const handleOnline = () => { processQueue(); };
    window.addEventListener("online", handleOnline);

    // Periodic check every 2 minutes
    const interval = setInterval(processQueue, 120_000);

    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(interval);
    };
  }, []);

  return null;
}
