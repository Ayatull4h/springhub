"use client";
import { useEffect } from "react";
import { offlineDB } from "@/lib/offline-db";

/**
 * QueueWorker — processes the offline submission queue
 * when the app detects it's online.
 *
 * Inline in the app layout so it runs globally.
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
            for (const [key, value] of Object.entries(item.fieldData)) {
              formData.set(key, String(value ?? ""));
            }
            const res = await fetch("/api/reports", {
              method: "POST",
              headers: item.csrfToken ? { "x-csrf-token": item.csrfToken } : {},
              body: formData,
            });
            if (res.ok) {
              await offlineDB.deleteQueued(item.id);
              // Create notification for successful submission
              await fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "submission-sent",
                  title: "Laporan terkirim!",
                  body: `Laporan ${item.formSlug} berhasil dikirim.`,
                }),
              }).catch(() => {});
            } else {
              // Increment retry count
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
    const handleOnline = () => {
      processQueue();
    };
    window.addEventListener("online", handleOnline);

    // Also check periodically every 2 minutes
    const periodicInterval = setInterval(processQueue, 120_000);

    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(periodicInterval);
    };
  }, []);

  return null;
}
