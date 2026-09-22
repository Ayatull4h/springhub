"use client";

import Link from "next/link";
import { Handshake, ArrowRight, Sprout, Layers, Droplets, Telescope } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { UcengIcon, WaderIcon } from "@/components/sections/eco-icons";
import { Pebbles, LilyPad } from "@/components/sections/river-ornaments";

const projectTypes = [
  { icon: Sprout, label: "donate.partnerTree", desc: "donate.partnerTreeDesc", color: "text-emerald-600" },
  { icon: Layers, label: "donate.partnerTrench", desc: "donate.partnerTrenchDesc", color: "text-amber-600" },
  { icon: Droplets, label: "donate.partnerSpring", desc: "donate.partnerSpringDesc", color: "text-blue-600" },
  { icon: Telescope, label: "donate.partnerMonitor", desc: "donate.partnerMonitorDesc", color: "text-purple-600" },
];

export function PartnerSection() {
  const { t } = useI18n();

  return (
    <section className="container-page overflow-x-clip py-16">
      <div className="transition-transform hover:rotate-0 md:-rotate-1">
      <div className="relative overflow-hidden rounded-[46%_54%_52%_48%/22%_26%_24%_28%] bg-gradient-to-br from-lagoon-200 via-sky-200 to-lagoon-300 px-6 py-12 text-sky-950 ring-4 ring-lagoon-300/70 md:px-16 dark:from-sky-900 dark:via-sky-800 dark:to-sky-900 dark:text-white dark:ring-sky-700 drop-shadow-[0_18px_28px_rgba(8,47,73,0.35)]">
      {/* riak genangan */}
      <div aria-hidden="true" className="pointer-events-none absolute left-[8%] top-[12%] h-16 w-1/3 rounded-[50%] border-[3px] border-white/50" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-[10%] right-[10%] h-20 w-1/4 rounded-[50%] border-2 border-white/40" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-4 rounded-[46%_54%_52%_48%/24%_28%_26%_30%] border-2 border-white/30" />
      {/* penghuni genangan */}
      <UcengIcon className="pointer-events-none absolute bottom-[14%] left-[6%] hidden w-16 -rotate-6 opacity-80 sm:block" />
      <WaderIcon className="pointer-events-none absolute right-[5%] top-[12%] hidden w-14 rotate-6 opacity-80 sm:block" />
      <LilyPad className="pointer-events-none absolute bottom-[8%] right-[22%] hidden w-16 rotate-12 opacity-80 lg:block" />
      <Pebbles className="pointer-events-none absolute left-[3%] top-[16%] hidden w-14 opacity-70 lg:block" />
      <div className="relative">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-sky-900 dark:text-sky-100">
            <Handshake className="h-4 w-4 text-sky-700 dark:text-bkksun" />
            {t("donate.becomePartner")}
          </div>
          <h3 className="mt-1 font-display text-xl font-bold tracking-tight text-sky-950 md:text-2xl dark:text-white">
            {t("donate.partnerTitle")}
          </h3>
          <p className="mt-1 max-w-xl text-sm text-sky-950/75 dark:text-white/80">
            {t("donate.partnerDesc")}
          </p>

          <ul className="mt-3 grid gap-x-4 gap-y-2 text-xs text-sky-950/75 sm:grid-cols-2 dark:text-white/75">
            {projectTypes.map(pt => {
              const Icon = pt.icon;
              return (
                <li key={pt.label} className="flex items-center gap-1.5">
                  <Icon className={`h-3.5 w-3.5 flex-none ${pt.color}`} />
                  <span>
                    <span className="font-semibold text-sky-950 dark:text-white">{t(pt.label)}</span>
                    {" · "}{t(pt.desc)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-shrink-0 flex-wrap items-center gap-2 md:ml-auto">
          <a href="mailto:info@jagasemesta.id" className="whitespace-nowrap rounded-[60%_40%_55%_45%/55%_45%_60%_40%] bg-tang-500 px-5 py-2.5 font-display text-sm font-bold text-amber-950 shadow-[3px_3px_0_rgba(120,53,15,0.9)] ring-2 ring-white/60 transition hover:rotate-0 -rotate-1">
            {t("donate.becomePartnerCta")} <ArrowRight className="ml-1 inline h-4 w-4" />
          </a>
          <Link href="/help" className="whitespace-nowrap rounded-[40%_60%_45%_55%/45%_55%_40%_60%] border-2 border-sky-800/30 px-5 py-2.5 text-sm font-semibold text-sky-900 transition hover:bg-white/40 dark:border-white/40 dark:text-white dark:hover:bg-white/10">
            {t("donate.downloadDeck")}
          </Link>
        </div>
        </div>
      </div>
      </div>
      </div>
    </section>
  );
}
