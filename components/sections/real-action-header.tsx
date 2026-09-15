"use client";

import { useI18n } from "@/lib/i18n";

export function RealActionHeader() {
  const { t } = useI18n();
  return (
    <>
      <h2 className="text-center font-display text-3xl font-bold tracking-tight text-bkk-700 md:text-5xl dark:text-white">
        {t("action.title")}{" "}
        <span className="text-bkk-500">{t("action.titleAccent")}</span>
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-ink-muted">
        {t("action.description")}
      </p>
    </>
  );
}
