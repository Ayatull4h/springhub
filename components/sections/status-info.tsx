"use client";
import { Info, Circle } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";

export function StatusInfo() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
      >
        <Info className="h-3 w-3" />
        {t("status.what")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-ink">{t("status.title")}</h3>
            <div className="mt-4 space-y-4">
              <div className="flex gap-3">
                <Circle className="mt-0.5 h-5 w-5 fill-emerald-500 text-emerald-500" />
                <div>
                  <p className="font-semibold text-ink">{t("status.healthy")}</p>
                  <p className="text-sm text-ink-muted">
                    {t("status.healthyDesc")}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Circle className="mt-0.5 h-5 w-5 fill-amber-500 text-amber-500" />
                <div>
                  <p className="font-semibold text-ink">{t("status.restoration")}</p>
                  <p className="text-sm text-ink-muted">
                    {t("status.restorationDesc")}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Circle className="mt-0.5 h-5 w-5 fill-red-500 text-red-500" />
                <div>
                  <p className="font-semibold text-ink">{t("status.degraded")}</p>
                  <p className="text-sm text-ink-muted">
                    {t("status.degradedDesc")}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="btn-primary mt-6 w-full"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
