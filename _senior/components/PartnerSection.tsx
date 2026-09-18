"use client";

import Link from "next/link";
import { Handshake, ArrowRight, Sprout, Layers, Droplets, Telescope } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { BkkCloudBox } from "@/components/sections/bkk-decor";

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
      <BkkCloudBox className="bg-gradient-to-br from-tang-500 via-tang-500 to-bkkpink-600 px-12 py-10 text-white md:px-16 drop-shadow-[0_18px_28px_rgba(61,22,96,0.16)]" flip={false}>
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-bkk-100">
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
          <a href="mailto:info@jagasemesta.id" className="whitespace-nowrap rounded-full bg-bkksun px-5 py-2.5 font-display text-sm font-bold text-bkk-900 transition hover:brightness-95">
            {t("donate.becomePartnerCta")} <ArrowRight className="ml-1 inline h-4 w-4" />
          </a>
          <Link href="/help" className="whitespace-nowrap rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
            {t("donate.downloadDeck")}
          </Link>
        </div>
      </div>
      </BkkCloudBox>
      </div>
    </section>
  );
}
