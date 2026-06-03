"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Wifi, WifiOff, Signal, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { offlineDB } from "@/lib/offline-db";

type OfflineBanner = {
  visible: boolean;
  mode: "signal-lost" | "auto-sync" | "offline-active";
  queueCount: number;
};

const HEARTBEAT_INTERVAL = 60_000; // 60 detik
const HEARTBEAT_FAIL_THRESHOLD = 5; // 5 menit gagal baru muncul banner
const BANNER_COOLDOWN = 600_000; // 10 menit setelah dismiss

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
  const cooldownUntil = useRef(0);
  const bannerDismissed = useRef(false);

  // ── Online/Offline listener ──────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setHeartbeatFails(0);
      bannerDismissed.current = false;
      setBanner((prev) => ({ ...prev, visible: false }));
      syncPendingQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (!bannerDismissed.current && Date.now() > cooldownUntil.current) {
        showSignalLostBanner();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ── Heartbeat ping every 60s ────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!navigator.onLine) return;

      try {
        const res = await fetch("/api/health", {
          method: "HEAD",
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          setHeartbeatFails(0);
          if (!isOnline) {
            setIsOnline(true);
            bannerDismissed.current = false;
            setBanner((prev) => ({ ...prev, visible: false }));
            syncPendingQueue();
          }
        } else {
          handleHeartbeatFail();
        }
      } catch {
        handleHeartbeatFail();
      }
    }, HEARTBEAT_INTERVAL);

    return () => clearInterval(interval);
  }, [isOnline]);

  const handleHeartbeatFail = useCallback(() => {
    setHeartbeatFails((prev) => {
      const next = prev + 1;
      if (next >= HEARTBEAT_FAIL_THRESHOLD) {
        setIsOnline(false);
        if (!bannerDismissed.current && Date.now() > cooldownUntil.current) {
          showSignalLostBanner();
        }
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
        const csrfRes = await fetch("/api/csrf");
        const csrfData = await csrfRes.json();
        const csrfToken = csrfData.token || "";

        const formData = new FormData();
        formData.set("form_slug", report.formSlug);
        formData.set("_submit_time", String(Date.now()));
        formData.set("_website", "");

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
    bannerDismissed.current = true;
    cooldownUntil.current = Date.now() + BANNER_COOLDOWN;
    setBanner((prev) => ({ ...prev, visible: false }));
  };

  if (!banner.visible) return null;

  return (
    <div className="fixed inset-x-0 top-16 z-50 mx-auto max-w-sm px-4 animate-slide-down">
      {banner.mode === "signal-lost" && (
        <div className="rounded-lg border border-amber-200 bg-white p-3 shadow-md dark:border-amber-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Signal className="h-4 w-4 text-amber-500" />
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                Koneksi terputus
              </p>
            </div>
            <button onClick={dismissBanner} className="text-amber-400 hover:text-amber-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <button onClick={handleActivateFullMode} className="rounded-md bg-amber-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-amber-700">
              Mode Offline
            </button>
            <button onClick={handleActivateSaveOnly} className="rounded-md border border-amber-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:bg-slate-700 dark:text-amber-300">
              Simpan Saja
            </button>
            <button onClick={dismissBanner} className="text-[11px] text-amber-500 underline hover:text-amber-700">
              Tutup 10 menit
            </button>
          </div>
        </div>
      )}

      {banner.mode === "auto-sync" && (
        <div className="rounded-lg border border-brand-200 bg-white p-3 shadow-md dark:border-brand-700 dark:bg-slate-800">
          <div className="flex items-center gap-2">
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
            ) : (
              <Wifi className="h-4 w-4 text-brand-600" />
            )}
            <p className="text-xs font-medium text-brand-800 dark:text-brand-200">
              {syncing ? "Mengirim laporan..." : "Laporan terkirim!"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
