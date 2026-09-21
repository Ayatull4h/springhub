"use client";

import { useI18n } from "@/lib/i18n";
import { BkkTitleCloud } from "./bkk-decor";
import {
  BambooIcon,
  BanyanIcon,
  StoneIcon,
  WaderIcon,
  PariIcon,
  UcengIcon,
  KepekIcon,
} from "./eco-icons";

const ITEMS = [
  { key: "eco.bamboo", Icon: BambooIcon, bg: "bg-leaf-100 dark:bg-leaf-700/30" },
  { key: "eco.banyan", Icon: BanyanIcon, bg: "bg-leaf-100 dark:bg-leaf-700/30" },
  { key: "eco.stone", Icon: StoneIcon, bg: "bg-white dark:bg-slate-800" },
  { key: "eco.wader", Icon: WaderIcon, bg: "bg-lagoon-100 dark:bg-lagoon-700/30" },
  { key: "eco.pari", Icon: PariIcon, bg: "bg-lagoon-100 dark:bg-lagoon-700/30" },
  { key: "eco.uceng", Icon: UcengIcon, bg: "bg-tang-100 dark:bg-tang-700/30" },
  { key: "eco.kepek", Icon: KepekIcon, bg: "bg-bkk-100 dark:bg-bkk-700/30" },
] as const;

export function EcosystemStrip() {
  const { t } = useI18n();
  return (
    <section id="ecosystem" className="bg-white py-16 md:py-20 dark:bg-slate-900">
      <div className="container-page">
        <h2 className="font-display text-3xl font-bold tracking-tight text-bkk-700 md:text-5xl dark:text-white">
          <BkkTitleCloud cloudClass="text-cream dark:text-slate-800">
            {t("eco.title")} <span className="text-bkk-500">{t("eco.titleAccent")}</span>
          </BkkTitleCloud>
        </h2>
        <p className="mt-3 max-w-2xl text-ink-muted">{t("eco.subtitle")}</p>
        <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 md:gap-7 lg:grid-cols-7">
          {ITEMS.map(({ key, Icon, bg }, i) => (
            <div
              key={key}
              className={`flex flex-col items-center rounded-[46%_54%_52%_48%/22%_30%_24%_32%] bg-white p-4 shadow-elevated transition-transform hover:rotate-0 dark:bg-slate-900 ${
                i % 2 ? "md:rotate-1 md:translate-y-3" : "md:-rotate-1"
              }`}
            >
              <span className={`grid h-16 w-16 place-items-center rounded-[55%_45%_50%_50%/50%_55%_45%_50%] ${bg}`}>
                <Icon className="h-12 w-12" />
              </span>
              <span className="mt-3 text-center text-xs font-bold text-ink">{t(key)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
