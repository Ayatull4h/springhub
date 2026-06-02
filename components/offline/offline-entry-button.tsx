"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WifiOff, Download, LogIn, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

type UserInfo = {
  id: string;
  username: string;
  role: string;
} | null;

/**
 * OfflineEntryButton — tombol "Aktifkan Mode Offline" di dashboard.
 *
 * Melakukan 3 pengecekan sebelum redirect ke /offline:
 * 1. Apakah user sudah login?
 * 2. Apakah PWA sudah di-install?
 * 3. Apakah sudah pernah setup sebelumnya?
 */
export function OfflineEntryButton() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo>(null);
  const [loading, setLoading] = useState(true);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // ── Fetch user ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // ── Detect PWA install status ──────────────────────────────────────────
  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isFullscreen = window.matchMedia("(display-mode: fullscreen)").matches;
    const isMinimalUi = window.matchMedia("(display-mode: minimal-ui)").matches;
    setIsPwaInstalled(isStandalone || isFullscreen || isMinimalUi);

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler as EventListener);

    // Detect successful install
    window.addEventListener("appinstalled", () => {
      setIsPwaInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler as EventListener);
    };
  }, []);

  // ── Handle install ──────────────────────────────────────────────────────
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setIsPwaInstalled(true);
      setShowInstallPrompt(false);
    }
    setDeferredPrompt(null);
  };

  // ── Handle click ────────────────────────────────────────────────────────
  const handleClick = () => {
    if (!user) {
      router.push("/sign-in?redirect=/offline");
      return;
    }
    if (!isPwaInstalled) {
      handleInstall();
      return;
    }
    router.push("/offline");
  };

  if (loading) return null;

  return (
    <div className="flex flex-col items-end gap-2">
      {/* Main button */}
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-2 rounded-xl border-2 border-brand-200 bg-brand-50 px-5 py-3 text-sm font-bold text-brand-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-100 hover:shadow-md dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-300 dark:hover:border-brand-700 dark:hover:bg-brand-900/40"
      >
        <WifiOff className="h-5 w-5" />
        Aktifkan Mode Offline
      </button>

      {/* Status checks */}
      <div className="flex flex-col items-end gap-1 text-[11px]">
        {/* Login check */}
        <span
          className={`inline-flex items-center gap-1 ${
            user ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
          }`}
        >
          {user ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <AlertTriangle className="h-3 w-3" />
          )}
          {user ? `Login sebagai ${user.username}` : "Belum login"}
        </span>

        {/* PWA check */}
        <span
          className={`inline-flex items-center gap-1 ${
            isPwaInstalled
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-amber-600 dark:text-amber-400"
          }`}
        >
          {isPwaInstalled ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <Download className="h-3 w-3" />
          )}
          {isPwaInstalled ? "Aplikasi terinstall" : "Install aplikasi dulu"}
        </span>
      </div>
    </div>
  );
}
