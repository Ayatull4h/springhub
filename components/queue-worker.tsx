"use client";
import { useEffect, useRef } from "react";
import { offlineDB } from "@/lib/offline-db";
import { useToast } from "@/components/toast";

const MAX_RETRIES = 5;
const POLL_INTERVAL_MS = 30_000;

export function QueueWorker() {
  const { toast } = useToast();
  const processingRef = useRef(false);

  useEffect(() => {
    const processQueue = async () => {
      if (processingRef.current) return;
      processingRef.current = true;
      try {
        const queue = await offlineDB.getAllQueued();
        if (queue.length === 0) return;

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
              headers: item.csrfToken ? { "x-csrf-token": item.csrfToken } : {},
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
          toast(`${successCount} laporan offline berhasil dikirim!`, "success");
        }
      } catch {
        // Silently fail — will retry when online event fires
      } finally {
        processingRef.current = false;
      }
    };

    processQueue();

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
