"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { SimpleOfflineForm } from "@/components/offline/simple-offline-form";
import { offlineDB } from "@/lib/offline-db";

/**
 * OfflinePage — Simplified PWA offline mode.
 *
 * Skenario:
 * 1. Klik ikon PWA → langsung ke /offline (start_url di manifest.json)
 * 2. Cek IndexedDB — jika tidak ada, tampilkan error (Incognito)
 * 3. Langsung tampilkan daftar form — tanpa setup/login
 * 4. Background: coba cache session + forms untuk sesi berikutnya
 * 5. Isi form → GPS → foto → submit → IndexedDB
 * 6. Online → QueueWorker sync otomatis
 */

type OfflinePhase = "checking" | "form" | "storage-error";

function OfflinePageContent() {
  const router = useRouter();
  const [phase, setPhase] = useState<OfflinePhase>("checking");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function init() {
      // 1. Cek IndexedDB
      const dbOk = await offlineDB.isAvailable().catch(() => false);
      if (!dbOk) {
        setPhase("storage-error");
        const isChrome = typeof navigator !== "undefined" && /Chrome|CriOS/i.test(navigator.userAgent);
        const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
        if (isAndroid && isChrome) {
          setErrorMsg(
            "Penyimpanan lokal (IndexedDB) tidak tersedia.\n\n" +
            "Android Chrome di mode Incognito tidak mendukung IndexedDB.\n" +
            "Solusi:\n" +
            "1. Buka Chrome tab biasa (bukan Incognito)\n" +
            "2. Pastikan storage HP tidak penuh\n" +
            "3. Chrome Settings > Site Settings > Storage > Hapus data"
          );
        } else {
          setErrorMsg("Penyimpanan lokal tidak tersedia. Gunakan non-private browsing.");
        }
        return;
      }

      // 2. Langsung ke form — tanpa blocking
      setPhase("form");

      // 3. Background: coba cache session + forms (silent fail)
      try {
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.user) {
            await offlineDB.saveSession({
              id: "user-session",
              userId: meData.user.id || meData.user.email,
              username: meData.user.username || "User",
              role: meData.user.role || "volunteer",
              csrfToken: meData.csrfToken || "",
              cachedAt: Date.now(),
            });
          }
        }
      } catch {}

      try {
        const formsRes = await fetch("/api/forms");
        if (formsRes.ok) {
          const formsData = await formsRes.json();
          const forms = formsData.forms || formsData.data || formsData;
          if (Array.isArray(forms) && forms.length > 0) {
            await offlineDB.saveForms(forms);
          }
        }
      } catch {}
      // Jika gagal — form akan pakai definisi static dari lib/forms.ts (fallback)
    }

    init();
  }, []);

  if (phase === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600" />
          <p className="mt-4 text-sm text-ink-muted">Mode Offline...</p>
        </div>
      </div>
    );
  }

  if (phase === "storage-error") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-ink">Mode Offline Tidak Tersedia</h1>
          <p className="mt-2 whitespace-pre-line text-left text-sm text-ink-muted">{errorMsg}</p>
          <div className="mt-6">
            <button onClick={() => router.push("/")} className="btn-primary">
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Langsung tampilkan daftar form ──────────────────────────────────
  return <SimpleOfflineForm />;
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
