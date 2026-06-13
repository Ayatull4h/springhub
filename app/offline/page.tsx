"use client";

import { Component, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { WifiOff, Loader2, AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { OfflineSetup } from "@/components/offline/offline-setup";
import { OfflineSurveyMap } from "@/components/offline/offline-survey-map";
import { OfflineExitSync } from "@/components/offline/offline-exit-sync";
import { SimpleOfflineForm } from "@/components/offline/simple-offline-form";
import { offlineDB } from "@/lib/offline-db";

class OfflineErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[OfflineErrorBoundary]", error.message, error.stack, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-ink">Mode Offline Error</h1>
          <p className="mt-2 max-w-sm text-sm text-ink-muted">
            Terjadi kesalahan saat memuat mode offline.
          </p>
          {this.state.error && (
            <p className="mt-1 max-w-sm text-xs text-ink-subtle">
              {this.state.error.message}
            </p>
          )}
          <div className="mt-6 flex items-center gap-3">
            <Link href="/" className="btn-secondary">
              Kembali ke Beranda
            </Link>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="btn-primary inline-flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Coba Lagi
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

type OfflinePhase = "checking" | "not-logged-in" | "setup" | "survey" | "simple-form" | "exit-sync" | "storage-error";

function OfflinePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode") || "save-only";
  const isFullMode = mode === "full";

  const [phase, setPhase] = useState<OfflinePhase>("checking");
  const [checkError, setCheckError] = useState("");
  const [storageInfo, setStorageInfo] = useState("");
  const [isAndroid, setIsAndroid] = useState(false);

  // ── Check prerequisites ────────────────────────────────────────────────
  useEffect(() => {
    async function check() {
      try {
        // Deteksi Android
        try {
          if (typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent)) {
            setIsAndroid(true);
          }
        } catch {}

        // Check IndexedDB availability (iOS Chrome / private mode / Android Incognito sering blokir)
        const dbOk = await offlineDB.isAvailable();
        if (!dbOk) {
          setPhase("storage-error");
          const isChrome = typeof navigator !== "undefined" && /Chrome|CriOS/i.test(navigator.userAgent);
          const isAndroid2 = /Android/i.test(typeof navigator !== "undefined" ? navigator.userAgent : "");
          if (isAndroid2 && isChrome) {
            setCheckError(
              "Penyimpanan lokal (IndexedDB) tidak tersedia. Android Chrome di mode Incognito atau private browsing tidak mendukung IndexedDB.\n\n" +
              "Solusi:\n" +
              "1. Tutup mode Incognito (buka Chrome > tab biasa)\n" +
              "2. Pastikan storage tidak penuh (>500 MB free)\n" +
              "3. Chrome Settings > Site Settings > Storage > Hapus data\n" +
              "4. Atau gunakan Firefox / Kiwi Browser yang support IndexedDB di private mode"
            );
          } else {
            setCheckError("Penyimpanan lokal (IndexedDB) tidak tersedia. Coba gunakan non-private browsing.");
          }
          return;
        }

        // Check storage estimate
        try {
          const { used, quota } = await offlineDB.estimateUsage();
          if (quota !== null && used !== null) {
            const usedMB = Math.round(used / 1024 / 1024);
            const quotaMB = Math.round(quota / 1024 / 1024);
            if (usedMB > quotaMB * 0.8) {
              setStorageInfo(`Peringatan: penyimpanan hampir penuh (${usedMB}/${quotaMB} MB). Hapus data lama untuk hasil terbaik.`);
            }
          }
        } catch {}

        // Check login
        let meData;
        try {
          const meRes = await fetch("/api/auth/me");
          meData = await meRes.json();
        } catch (fetchErr) {
          setPhase("not-logged-in");
          setCheckError(`Gagal terhubung ke server: ${fetchErr instanceof Error ? fetchErr.message : "Network error"}. Pastikan kamu online untuk setup awal.`);
          return;
        }

        if (!meData.user) {
          setPhase("not-logged-in");
          setCheckError("Kamu harus login untuk menggunakan mode offline.");
          return;
        }

        // Check if PWA is installed — warn but don't block
        let isStandalone = false;
        try {
          if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
            isStandalone =
              window.matchMedia("(display-mode: standalone)").matches ||
              window.matchMedia("(display-mode: fullscreen)").matches ||
              window.matchMedia("(display-mode: minimal-ui)").matches;
          }
        } catch {
          // matchMedia may not be available in all browsers
        }

        if (!isStandalone) {
          console.warn("Mode offline berfungsi optimal saat aplikasi terinstall.");
        }

        // Check if setup was already done (forms cached)
        let forms;
        try {
          forms = await offlineDB.getAllForms();
        } catch (dbErr) {
          setCheckError(`Gagal membaca data offline: ${dbErr instanceof Error ? dbErr.message : "Unknown error"}. Coba refresh halaman.`);
          setPhase("not-logged-in");
          return;
        }

        if (forms.length > 0) {
          // Check if there's an active session
          try {
            const sessionRes = await fetch("/api/offline/session");
            const sessionData = await sessionRes.json();
            if (sessionData.session?.isActive) {
              // Resume existing session — simple form mode, no map
              setPhase("simple-form");
              return;
            }
          } catch {
            // Server may be offline — resume anyway
            setPhase("simple-form");
            return;
          }
        }

        // Need to go through setup
        setPhase("setup");
      } catch (err) {
        console.error("Offline prerequisite check failed:", err);
        setPhase("not-logged-in");
        const msg = err instanceof Error ? err.message : "Unknown error";
        setCheckError(`Gagal memeriksa status: ${msg}. Pastikan kamu online untuk setup awal.`);
      }
    }

    check();
  }, []);

  // ── Phase: Not logged in ───────────────────────────────────────────────
  if (phase === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600" />
          <p className="mt-4 text-sm text-ink-muted">Memeriksa persyaratan...</p>
        </div>
      </div>
    );
  }

  if (phase === "not-logged-in") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-ink">Akses Dibatasi</h1>
          <p className="mt-2 text-sm text-ink-muted">{checkError}</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/sign-in?redirect=/offline" className="btn-primary">
              Login
            </Link>
            <Link href="/" className="btn-secondary">
              Kembali
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Phase: Storage Error ──────────────────────────────────────────────
  if (phase === "storage-error") {
    const isAndroidChrome = isAndroid && typeof navigator !== "undefined" && /Chrome/i.test(navigator.userAgent);
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-ink">Mode Offline Tidak Tersedia</h1>
          <p className="mt-2 whitespace-pre-line text-left text-sm text-ink-muted">{checkError}</p>

          {isAndroidChrome ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-left text-xs text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
              <strong className="block mb-1">🔍 Deteksi: Android + Chrome</strong>
              <p>IndexedDB tidak tersedia. Kemungkinan penyebab:</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                <li><strong>Mode Incognito</strong> — buka Chrome tab biasa</li>
                <li><strong>Storage penuh</strong> — hapus file/cache HP</li>
                <li><strong>Pengaturan situs</strong> — Settings → Site Settings → Clear Data</li>
              </ul>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-left text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
              <strong>Tips:</strong>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                <li>Nonaktifkan <strong>Private Browsing</strong></li>
                <li>Coba browser lain (Firefox, Kiwi Browser)</li>
                <li>Install PWA: ⋮ → Add to Home Screen</li>
                <li>Clear cache: Settings → Apps → Chrome → Storage</li>
              </ul>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/" className="btn-primary">
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Phase: Setup ───────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="container-page py-8">
        <button
          onClick={() => router.push("/")}
          className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-ink-line bg-white px-4 py-2 text-sm font-medium text-ink shadow-sm transition hover:bg-slate-50 hover:text-brand-600 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </button>

        {storageInfo && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
            {storageInfo}
          </div>
        )}

        <OfflineErrorBoundary>
          <OfflineSetup
            mode={isFullMode ? "full" : "save-only"}
            onComplete={() => setPhase(isFullMode ? "survey" : "simple-form")}
          />
        </OfflineErrorBoundary>
      </div>
    );
  }

  // ── Phase: Simple form (PWA-friendly, no map) ─────────────────────────
  if (phase === "simple-form") {
    return (
      <SimpleOfflineForm onExit={() => setPhase("setup")} />
    );
  }

  // ── Phase: Survey ──────────────────────────────────────────────────────
  if (phase === "survey") {
    return (
      <OfflineErrorBoundary>
        <OfflineSurveyMap
          selectedForms={[]} // loaded from IndexedDB inside component
          onExit={() => setPhase("exit-sync")}
        />
      </OfflineErrorBoundary>
    );
  }

  // ── Phase: Exit Sync ───────────────────────────────────────────────────
  if (phase === "exit-sync") {
    return (
      <div className="container-page py-8">
        <OfflineExitSync
          onComplete={() => router.push("/")}
          onCancel={() => setPhase("survey")}
        />
      </div>
    );
  }

  return null;
}

export default function OfflinePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      }
    >
      <OfflinePageContent />
    </Suspense>
  );
}
