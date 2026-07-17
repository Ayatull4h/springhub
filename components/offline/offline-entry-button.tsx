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
      className="flex w-full h-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-brand-200 bg-brand-50 px-3 py-3 text-xs font-semibold text-brand-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-100 hover:shadow-md dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-300 dark:hover:border-brand-700 dark:hover:bg-brand-900/40"
    >
      <WifiOff className="h-4 w-4" />
      <span>Offline</span>
      <span className="font-normal text-[10px] opacity-70">Survey tanpa internet</span>
    </button>
  );
}
