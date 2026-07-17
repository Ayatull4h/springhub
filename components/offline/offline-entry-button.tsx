"use client";

import { useRouter } from "next/navigation";
import { WifiOff } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function OfflineEntryButton() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <button
      onClick={() => router.push("/offline")}
      className="inline-flex items-center gap-2 rounded-xl border-2 border-brand-200 bg-brand-50 px-5 py-3 text-sm font-bold text-brand-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-100 hover:shadow-md dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-300 dark:hover:border-brand-700 dark:hover:bg-brand-900/40"
    >
      <WifiOff className="h-5 w-5" />
      {t("offline.entryButton")}
    </button>
  );
}
