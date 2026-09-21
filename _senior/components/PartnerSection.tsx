"use client";

import Link from "next/link";
import { Handshake, ArrowRight, Sprout, Layers, Droplets, Telescope } from "lucide-react";
import { useI18n } from "@/lib/i18n";

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
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 px-6 py-10 text-white ring-4 ring-amber-950/30 md:px-16 dark:from-amber-950 dark:via-amber-900 dark:to-amber-950 drop-shadow-[0_18px_28px_rgba(8,47,73,0.35)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-1/4 w-2 rounded-full bg-amber-900/30" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-2/4 w-2 rounded-full bg-amber-900/30" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3/4 w-2 rounded-full bg-amber-900/30" />
      <div className="relative">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
            <Handshake className="h-4 w-4 text-bkksun" />
            {t("donate.becomePartner")}
          </div>
          <h3 className="mt-1 font-display text-xl font-bold tracking-tight text-white md:text-2xl">
            {t("donate.partnerTitle")}
          </h3>
          <p className="mt-1 max-w-xl text-sm text-white/80">
            {t("donate.partnerDesc")}
          </p>

          <ul className="mt-3 grid gap-x-4 gap-y-2 text-xs text-white/75 sm:grid-cols-2">
            {projectTypes.map(pt => {
              const Icon = pt.icon;
              return (
                <li key={pt.label} className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 flex-none text-bkksun" />
                  <span>
                    <span className="font-semibold text-white">{t(pt.label)}</span>
                    {" · "}{t(pt.desc)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-shrink-0 flex-wrap items-center gap-2 md:ml-auto">
          <a href="mailto:info@jagasemesta.id" className="whitespace-nowrap rounded-full bg-bkksun px-5 py-2.5 font-display text-sm font-bold text-amber-950 transition hover:brightness-95">
            {t("donate.becomePartnerCta")} <ArrowRight className="ml-1 inline h-4 w-4" />
          </a>
          <Link href="/help" className="whitespace-nowrap rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
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
