"use client";

import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function OfflineLoading() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600" />
        <p className="mt-4 text-sm text-ink-muted">{t("offline.preparing")}</p>
      </div>
    </div>
  );
}
