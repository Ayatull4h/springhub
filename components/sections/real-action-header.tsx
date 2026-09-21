"use client";

import { useI18n } from "@/lib/i18n";
import { BkkTitleCloud } from "./bkk-decor";

export function RealActionHeader() {
  const { t } = useI18n();
  return (
    <>
      <h2 className="font-display text-3xl font-bold tracking-tight text-sky-900 md:text-5xl dark:text-white">
        <BkkTitleCloud cloudClass="text-white dark:text-slate-800">{t("action.title")}{" "}
        <span className="text-lagoon-600">{t("action.titleAccent")}</span></BkkTitleCloud>
      </h2>
      <p className="mt-3 max-w-2xl text-ink-muted">
        {t("action.description")}
      </p>
    </>
  );
}
