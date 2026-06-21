"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Smartphone, Monitor } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Platform = "android" | "ios" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return "other";
}

function isPwaInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as Record<string, unknown>).standalone === true
  );
}

export default function PwaInstallGuide() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isPwaInstalled());
  }, []);

  // Jika sudah terinstall, tidak perlu panduan
  if (installed) return null;

  return (
    <div className="mb-6 rounded-lg border border-brand-200 bg-brand-50 dark:border-brand-700 dark:bg-slate-800/80">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-brand-800 dark:text-brand-200"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Smartphone className="h-4 w-4" />
          💡 {t("pwa.guide.title")}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-brand-200 px-4 pb-4 pt-3 dark:border-brand-700">
          {platform === "android" && (
            <div className="space-y-3 text-sm text-ink dark:text-slate-200">
              <h4 className="flex items-center gap-2 font-semibold">
                <Smartphone className="h-4 w-4 text-green-600" />
                {t("pwa.guide.androidTitle")}
              </h4>
              <ol className="ml-5 list-decimal space-y-1.5 text-ink-muted dark:text-slate-300">
                <li dangerouslySetInnerHTML={{ __html: t("pwa.guide.androidStep1") }} />
                <li dangerouslySetInnerHTML={{ __html: t("pwa.guide.androidStep2") }} />
                <li dangerouslySetInnerHTML={{ __html: t("pwa.guide.androidStep3") }} />
                <li dangerouslySetInnerHTML={{ __html: t("pwa.guide.androidStep4") }} />
                <li>{t("pwa.guide.androidStep5")}</li>
              </ol>
            </div>
          )}

          {platform === "ios" && (
            <div className="space-y-3 text-sm text-ink dark:text-slate-200">
              <h4 className="flex items-center gap-2 font-semibold">
                <Smartphone className="h-4 w-4 text-blue-600" />
                {t("pwa.guide.iosTitle")}
              </h4>
              <ol className="ml-5 list-decimal space-y-1.5 text-ink-muted dark:text-slate-300">
                <li dangerouslySetInnerHTML={{ __html: t("pwa.guide.iosStep1") }} />
                <li>{t("pwa.guide.iosStep2")}</li>
                <li>{t("pwa.guide.iosStep3")}</li>
                <li>{t("pwa.guide.iosStep4")}</li>
                <li>{t("pwa.guide.iosStep5")}</li>
              </ol>
            </div>
          )}

          {platform === "other" && (
            <div className="space-y-4 text-sm text-ink dark:text-slate-200">
              <div>
                <h4 className="flex items-center gap-2 font-semibold">
                  <Smartphone className="h-4 w-4 text-green-600" />
                  {t("pwa.guide.androidTitle")}
                </h4>
                <ol className="ml-5 mt-1 list-decimal space-y-1 text-ink-muted dark:text-slate-300">
                  <li>{t("pwa.guide.otherAndroid")}</li>
                </ol>
              </div>
              <div>
                <h4 className="flex items-center gap-2 font-semibold">
                  <Smartphone className="h-4 w-4 text-blue-600" />
                  {t("pwa.guide.iosTitle")}
                </h4>
                <ol className="ml-5 mt-1 list-decimal space-y-1 text-ink-muted dark:text-slate-300">
                  <li>{t("pwa.guide.otherIos")}</li>
                </ol>
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 rounded-md bg-brand-100/50 px-3 py-2 text-xs text-ink-muted dark:bg-slate-700/50 dark:text-slate-300">
            <Monitor className="h-3.5 w-3.5 shrink-0" />
            <span>{t("pwa.guide.pcNote")}</span>
          </div>
        </div>
      )}
    </div>
  );
}
