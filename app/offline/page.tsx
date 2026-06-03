"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { WifiOff, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { OfflineSetup } from "@/components/offline/offline-setup";
import { OfflineSurveyMap } from "@/components/offline/offline-survey-map";
import { OfflineExitSync } from "@/components/offline/offline-exit-sync";
import { offlineDB } from "@/lib/offline-db";

type OfflinePhase = "checking" | "not-logged-in" | "setup" | "survey" | "exit-sync";

function OfflinePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode") || "full";
  const isFullMode = mode === "full";

  const [phase, setPhase] = useState<OfflinePhase>("checking");
  const [checkError, setCheckError] = useState("");

  // ── Check prerequisites ────────────────────────────────────────────────
  useEffect(() => {
    async function check() {
      try {
        // Check login
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();

        if (!meData.user) {
          setPhase("not-logged-in");
          setCheckError("Kamu harus login untuk menggunakan mode offline.");
          return;
        }

        // Check if PWA is installed — warn but don't block
        const isStandalone =
          window.matchMedia("(display-mode: standalone)").matches ||
          window.matchMedia("(display-mode: fullscreen)").matches ||
          window.matchMedia("(display-mode: minimal-ui)").matches;

        if (!isStandalone) {
          console.warn("Mode offline berfungsi optimal saat aplikasi terinstall.");
        }

        // Check if setup was already done (forms cached)
        const forms = await offlineDB.getAllForms();
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
      } catch {
        setPhase("not-logged-in");
        setCheckError("Gagal memeriksa status. Pastikan kamu online untuk setup awal.");
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

        <OfflineSetup
          mode={isFullMode ? "full" : "save-only"}
          onComplete={() => setPhase("survey")}
        />
      </div>
    );
  }

  // ── Phase: Survey ──────────────────────────────────────────────────────
  if (phase === "survey") {
    return (
      <OfflineSurveyMap
        selectedForms={[]} // loaded from IndexedDB inside component
        onExit={() => setPhase("exit-sync")}
      />
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
