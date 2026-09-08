"use client";

import { useI18n } from "@/lib/i18n";

export function RealActionHeader() {
  const { t } = useI18n();
  return (
    <>
      <h2 className="text-center text-3xl font-extrabold tracking-tight md:text-4xl">
        {t("action.title")}{" "}
        <span className="text-brand-600">{t("action.titleAccent")}</span>
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-ink-muted">
        {t("action.description")}
      </p>
    </>
  );
}
