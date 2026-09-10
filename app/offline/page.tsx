"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle, ChevronDown, Smartphone, Monitor } from "lucide-react";
import { SimpleOfflineForm } from "@/components/offline/simple-offline-form";
import PwaInstallGuide from "@/components/pwa-install-guide";
import { offlineDB } from "@/lib/offline-db";
import { fetchAndCacheSession } from "@/lib/session-cache";
import { APP_BUILD_TAG } from "@/lib/app-version";
import { useI18n } from "@/lib/i18n";

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

// Penanda build — definisi di lib/app-version.ts agar bisa dipakai lintas file
// (tidak boleh export const dari file page.tsx, merusak type Next.js).

type DiagInfo = {
  idbOk: boolean;
  usedMB: string;
  quotaMB: string;
  queueCount: number | null;
  swState: string;
  incognitoHint: string;
};

function DiagBox() {
  const { t } = useI18n();
  const [info, setInfo] = useState<DiagInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function load() {
    const result: DiagInfo = {
      idbOk: false,
      usedMB: "-",
      quotaMB: "-",
      queueCount: null,
      swState: "n/a",
      incognitoHint: "",
    };
    try {
      result.idbOk = await offlineDB.isAvailable().catch(() => false);
    } catch {
      result.idbOk = false;
    }
    try {
      const { used, quota } = await offlineDB.estimateUsage();
      result.usedMB = (used / 1048576).toFixed(1);
      result.quotaMB = quota ? (quota / 1048576).toFixed(0) : "?";
    } catch {}
    try {
      result.queueCount = await offlineDB.queueCount();
    } catch {}
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        result.swState = reg ? (reg.active ? t("offline.diagActive") : t("offline.diagSet")) : t("offline.diagNone");
      } else {
        result.swState = t("offline.diagUnsupported");
      }
    } catch {
      result.swState = "?";
    }
    try {
      const persisted = await navigator.storage?.persisted?.();
      result.incognitoHint = persisted ? "persist:ya" : "persist:tidak (khas incognito)";
    } catch {
      result.incognitoHint = "?";
    }
    setInfo(result);
  }

  async function copy() {
    if (!info) return;
    const text =
      `build:${APP_BUILD_TAG} idb:${info.idbOk ? "ok" : "GAGAL"}` +
      ` pakai:${info.usedMB}MB kuota:${info.quotaMB}MB antrean:${info.queueCount ?? "?"}` +
      ` sw:${info.swState} ${info.incognitoHint} ua:${navigator.userAgent.slice(0, 80)}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("Salin teks ini:", text);
    }
  }

  return (
    <div className="mx-auto mt-6 max-w-2xl rounded-lg border border-ink-line p-3 text-xs">
      <button
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) load();
        }}
        className="font-semibold text-ink-muted hover:text-ink"
      >
        {open ? "▾" : "▸"} {t("offline.diagTitle")}
      </button>
      {open && (
        <div className="mt-2 space-y-1 text-ink-muted">
          <p>{t("offline.diagVersion")} <b>{APP_BUILD_TAG}</b></p>
          {info ? (
            <>
              <p>{t("offline.diagIndexedDb")} <b>{info.idbOk ? t("offline.diagOk") : t("offline.diagFail")}</b></p>
              <p>{t("offline.diagUsed")} <b>{info.usedMB} MB</b> / kuota: <b>{info.quotaMB} MB</b></p>
              <p>{t("offline.diagQueue")} <b>{info.queueCount ?? "?"}</b></p>
              <p>Service worker: <b>{info.swState}</b> · {info.incognitoHint}</p>
              <button onClick={copy} className="btn-primary mt-2 !px-3 !py-1.5 !text-xs">
                {copied ? t("offline.diagCopied") : t("offline.diagCopy")}
              </button>
            </>
          ) : (
            <p>{t("offline.diagLoading")}</p>
          )}
        </div>
      )}
    </div>
  );
}

function OfflinePageContent() {
  const { t } = useI18n();
  const router = useRouter();
  const [phase, setPhase] = useState<OfflinePhase>("checking");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function init() {
      // 1. Cek IndexedDB
      const dbOk = await offlineDB.isAvailable().catch(() => false);
      if (!dbOk) {
        setPhase("storage-error");
        const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
        const isChrome = /Chrome|CriOS/i.test(ua);
        const isAndroid = /Android/i.test(ua);
        const isSafari = /^((?!chrome|android).)*safari/i.test(ua) || /iPad|iPhone|iPod/i.test(ua);
        if (isAndroid && isChrome) {
          setErrorMsg(t("offline.errIdbAndroid"));
        } else if (isSafari) {
          setErrorMsg(t("offline.errIdbSafari"));
        } else {
          setErrorMsg(t("offline.errIdbOther"));
        }
        return;
      }

      // 2. Langsung ke form — tanpa blocking
      setPhase("form");

      // 3. Background: cache session + forms (silent fail)
      fetchAndCacheSession().catch(() => {});

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
          <p className="mt-4 text-sm text-ink-muted">{t("offline.modeOffline")}</p>
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
          <h1 className="mt-4 text-xl font-bold text-ink">{t("offline.unavailableTitle")}</h1>
          <p className="mt-2 whitespace-pre-line text-left text-sm text-ink-muted">{errorMsg}</p>
          <div className="mt-6">
            <button onClick={() => router.push("/")} className="btn-primary">
              {t("offline.backHome")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Langsung tampilkan daftar form ──────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <PwaInstallGuide />
      <SimpleOfflineForm />
      <DiagBox />
      <p className="mt-4 text-center text-[10px] text-ink-subtle">SpringHub {APP_BUILD_TAG}</p>
    </div>
  );
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
