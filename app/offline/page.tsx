"use client";

import { Component, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { WifiOff, Loader2, AlertCircle, ArrowLeft, RefreshCw, CheckCircle2 } from "lucide-react";
import { OfflineSetup } from "@/components/offline/offline-setup";
import { OfflineSurveyMap } from "@/components/offline/offline-survey-map";
import { OfflineExitSync } from "@/components/offline/offline-exit-sync";
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

type OfflinePhase = "checking" | "not-logged-in" | "setup" | "survey" | "exit-sync" | "storage-error";

function OfflinePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode") || "full";
  const isFullMode = mode === "full";

  const [phase, setPhase] = useState<OfflinePhase>("checking");
  const [checkError, setCheckError] = useState("");
  const [storageInfo, setStorageInfo] = useState("");
  const [mapAvailable, setMapAvailable] = useState(true);
  const [effectiveMode, setEffectiveMode] = useState(isFullMode ? "full" : "save-only");

  // ── Check prerequisites ────────────────────────────────────────────────
  useEffect(() => {
    async function check() {
      try {
        // Check IndexedDB availability (iOS Chrome / private mode sering blokir)
        const dbOk = await offlineDB.isAvailable();
        if (!dbOk) {
          setPhase("storage-error");
          setCheckError("Penyimpanan lokal (IndexedDB) tidak tersedia. Coba gunakan Safari atau non-private browsing.");
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

        if (isFullMode) {
          try {
            // Test if Leaflet can be loaded (fails on some mobile browsers)
            const leaflet = await import("leaflet");
            const mapDiv = typeof document !== "undefined" ? document.createElement("div") : null;
            if (mapDiv && leaflet.version) {
              setMapAvailable(true);
              setEffectiveMode("full");
            }
          } catch {
            setMapAvailable(false);
            setEffectiveMode("save-only");
          }
        } else {
          setEffectiveMode("save-only");
        }

        if (forms.length > 0) {
          // Check if there's an active session
          try {
            const sessionRes = await fetch("/api/offline/session");
            const sessionData = await sessionRes.json();
            if (sessionData.session?.isActive) {
              // Resume existing session
              setPhase("survey");
              return;
            }
          } catch {
            // Server may be offline — resume anyway
            setPhase("survey");
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
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-ink">Mode Offline Tidak Tersedia</h1>
          <p className="mt-2 text-sm text-ink-muted">{checkError}</p>
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
            <strong>Tips untuk iOS:</strong>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              <li>Gunakan <strong>Safari</strong> (Chrome di iOS terbatas)</li>
              <li>Nonaktifkan <strong>Private Browsing</strong></li>
              <li>Install PWA: Share → Add to Home Screen</li>
              <li>Hapus data Safari: Settings → Safari → Clear History</li>
            </ul>
          </div>
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

        {!mapAvailable && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
            <strong>Mode Lite:</strong> Peta tidak tersedia di perangkat ini. Kamu tetap bisa mengisi form dan upload data offline, tanpa fitur peta dan marker GPS.
          </div>
        )}

        <OfflineErrorBoundary>
          <OfflineSetup
            mode={effectiveMode as "full" | "save-only"}
            onComplete={() => setPhase("survey")}
          />
        </OfflineErrorBoundary>
      </div>
    );
  }

  // ── Phase: Survey ──────────────────────────────────────────────────────
  if (phase === "survey") {
    if (!mapAvailable) {
      return (
        <div className="container-page py-8">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-ink">Siap!</h1>
            <p className="mt-2 text-sm text-ink-muted">
              Data form dan definisi field sudah tersimpan di perangkatmu.
            </p>
            <p className="mt-1 text-xs text-ink-subtle">
              Kamu bisa mengisi form tanpa koneksi internet. Data akan diupload saat kamu kembali online.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link href="/" className="btn-secondary">Kembali ke Beranda</Link>
              <Link href="/report/spring-monitoring" className="btn-primary">
                Mulai Isi Form
              </Link>
            </div>
          </div>
        </div>
      );
    }
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
