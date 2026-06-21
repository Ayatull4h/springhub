"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Smartphone, Monitor } from "lucide-react";

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
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isPwaInstalled());
  }, []);

  // Jika sudah terinstall, tidak perlu panduan
  if (installed) return null;

  const platformName = platform === "android" ? "Android" : platform === "ios" ? "iPhone/iPad" : "Android / iPhone";

  return (
    <div className="mb-6 rounded-lg border border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-950/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-brand-800 dark:text-brand-200"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Smartphone className="h-4 w-4" />
          💡 Install SpringHub untuk akses cepat dari layar utama
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-brand-200 px-4 pb-4 pt-3 dark:border-brand-800">
          {platform === "android" && (
            <div className="space-y-3 text-sm text-ink">
              <h4 className="flex items-center gap-2 font-semibold">
                <Smartphone className="h-4 w-4 text-green-600" />
                Android — Chrome
              </h4>
              <ol className="ml-5 list-decimal space-y-1.5 text-ink-muted">
                <li>Buka <strong>springhub.vercel.app</strong> di Chrome</li>
                <li>Tap ikon <strong>⋮</strong> (3 titik) di pojok kanan atas</li>
                <li>Tap <strong>&quot;Add to Home Screen&quot;</strong> (atau &quot;Install app&quot;)</li>
                <li>Tap <strong>&quot;Install&quot;</strong></li>
                <li>Ikon SpringHub muncul di home screen — tap untuk buka seperti aplikasi</li>
              </ol>
            </div>
          )}

          {platform === "ios" && (
            <div className="space-y-3 text-sm text-ink">
              <h4 className="flex items-center gap-2 font-semibold">
                <Smartphone className="h-4 w-4 text-blue-600" />
                iPhone/iPad — Safari
              </h4>
              <ol className="ml-5 list-decimal space-y-1.5 text-ink-muted">
                <li>Buka <strong>springhub.vercel.app</strong> di Safari</li>
                <li>Tap ikon <strong>📤</strong> (Share) di menu bawah</li>
                <li>Scroll ke bawah, tap <strong>&quot;Add to Home Screen&quot;</strong></li>
                <li>Tap <strong>&quot;Add&quot;</strong> di pojok kanan atas</li>
                <li>Ikon SpringHub muncul di home screen — tap untuk buka seperti aplikasi</li>
              </ol>
            </div>
          )}

          {platform === "other" && (
            <div className="space-y-4 text-sm text-ink">
              <div>
                <h4 className="flex items-center gap-2 font-semibold">
                  <Smartphone className="h-4 w-4 text-green-600" />
                  Android — Chrome
                </h4>
                <ol className="ml-5 mt-1 list-decimal space-y-1 text-ink-muted">
                  <li>Buka springhub.vercel.app di Chrome</li>
                  <li>Tap ⋮ → &quot;Add to Home Screen&quot; → &quot;Install&quot;</li>
                </ol>
              </div>
              <div>
                <h4 className="flex items-center gap-2 font-semibold">
                  <Smartphone className="h-4 w-4 text-blue-600" />
                  iPhone/iPad — Safari
                </h4>
                <ol className="ml-5 mt-1 list-decimal space-y-1 text-ink-muted">
                  <li>Buka springhub.vercel.app di Safari</li>
                  <li>Tap 📤 → &quot;Add to Home Screen&quot; → &quot;Add&quot;</li>
                </ol>
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 rounded-md bg-brand-100/50 px-3 py-2 text-xs text-ink-muted dark:bg-brand-900/30">
            <Monitor className="h-3.5 w-3.5 shrink-0" />
            <span>PC/Laptop: buka langsung di browser — mode offline tetap bisa diakses via ikon PWA setelah di-install.</span>
          </div>
        </div>
      )}
    </div>
  );
}
