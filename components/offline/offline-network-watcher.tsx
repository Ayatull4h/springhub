"use client";

import { useEffect, useState, useCallback } from "react";
import { Wifi, WifiOff, Signal, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { offlineDB } from "@/lib/offline-db";

type OfflineBanner = {
  visible: boolean;
  mode: "signal-lost" | "auto-sync" | "offline-active";
  queueCount: number;
};

/**
 * NetworkWatcher — dipasang di layout.tsx
 *
 * Monitor koneksi via:
 * 1. navigator.onLine events
 * 2. Heartbeat ping ke /api/health setiap 30 detik
 *
 * Saat sinyal hilang, tampilkan banner untuk:
 * - Aktifkan Mode Survei Lengkap (map + GPS + form)
 * - Simpan Laporan Saja (tanpa map)
 * - Tutup banner
 *
 * Saat online kembali, auto-sync pending reports.
 */
export function NetworkWatcher() {
  const router = useRouter();
  const [banner, setBanner] = useState<OfflineBanner>({
    visible: false,
    mode: "signal-lost",
    queueCount: 0,
  });
  const [isOnline, setIsOnline] = useState(true);
  const [heartbeatFails, setHeartbeatFails] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // ── Online/Offline listener ──────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setHeartbeatFails(0);
      setBanner((prev) => ({ ...prev, visible: false }));
      // Auto-sync when coming back online
      syncPendingQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      showSignalLostBanner();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ── Heartbeat ping every 30s ─────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!navigator.onLine) return; // already detected offline

      try {
        const res = await fetch("/api/health", {
          method: "HEAD",
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          setHeartbeatFails(0);
          if (!isOnline) {
            setIsOnline(true);
            setBanner((prev) => ({ ...prev, visible: false }));
            syncPendingQueue();
          }
        } else {
          handleHeartbeatFail();
        }
      } catch {
        handleHeartbeatFail();
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [isOnline]);

  const handleHeartbeatFail = useCallback(() => {
    setHeartbeatFails((prev) => {
      const next = prev + 1;
      if (next >= 2) {
        // 2 consecutive failures = signal lost
        setIsOnline(false);
        showSignalLostBanner();
      }
      return next;
    });
  }, []);

  const showSignalLostBanner = useCallback(async () => {
    const stats = await offlineDB.getStats();
    setBanner({
      visible: true,
      mode: "signal-lost",
      queueCount: stats.reports,
    });
  }, []);

  // ── Sync pending queue ───────────────────────────────────────────────────
  const syncPendingQueue = useCallback(async () => {
    const reports = await offlineDB.getAllReports();
    if (reports.length === 0) return;

    setSyncing(true);
    setBanner((prev) => ({ ...prev, mode: "auto-sync", visible: true }));

    let successCount = 0;
    let failCount = 0;

    for (const report of reports) {
      try {
        // Refresh CSRF token before submitting
        const csrfRes = await fetch("/api/csrf");
        const csrfData = await csrfRes.json();
        const csrfToken = csrfData.token || "";

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
          await offlineDB.deleteReport(report.id);
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setSyncing(false);

    if (failCount === 0) {
      setBanner((prev) => ({ ...prev, visible: false }));
    } else {
      setBanner((prev) => ({
        ...prev,
        mode: "signal-lost",
        queueCount: failCount,
      }));
    }
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleActivateFullMode = () => {
    router.push("/offline?mode=full");
    setBanner((prev) => ({ ...prev, visible: false }));
  };

  const handleActivateSaveOnly = () => {
    router.push("/offline?mode=save-only");
    setBanner((prev) => ({ ...prev, visible: false }));
  };

  const dismissBanner = () => {
    setBanner((prev) => ({ ...prev, visible: false }));
  };

  if (!banner.visible) return null;

  return (
    <div className="fixed inset-x-0 top-16 z-50 mx-auto max-w-2xl px-4">
      {banner.mode === "signal-lost" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-lg dark:border-amber-700 dark:bg-amber-900/30">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-800/50">
              <Signal className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Sinyal hilang!
              </p>
              <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
                {banner.queueCount > 0
                  ? `${banner.queueCount} laporan tersimpan lokal.`
                  : "Data form sudah siap offline."}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={handleActivateFullMode}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-700"
            >
              <WifiOff className="h-3.5 w-3.5" />
              Mode Survei Lengkap
            </button>
            <button
              onClick={handleActivateSaveOnly}
              className="rounded-lg border border-amber-300 bg-white px-3.5 py-2 text-xs font-medium text-amber-800 hover:bg-amber-50 dark:border-amber-600 dark:bg-amber-900/50 dark:text-amber-200 dark:hover:bg-amber-900/70"
            >
              Simpan Saja
            </button>
            <button
              onClick={dismissBanner}
              className="text-xs font-medium text-amber-600 underline hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
            >
              Nanti
            </button>
          </div>
        </div>
      )}

      {banner.mode === "auto-sync" && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 shadow-lg dark:border-brand-700 dark:bg-brand-900/30">
          <div className="flex items-center gap-3">
            {syncing ? (
              <Loader2 className="h-5 w-5 animate-spin text-brand-600 dark:text-brand-400" />
            ) : (
              <Wifi className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            )}
            <p className="text-sm font-medium text-brand-800 dark:text-brand-200">
              {syncing
                ? "Mengirim laporan tersimpan..."
                : "Laporan berhasil terkirim!"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
