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
    <section className="container-page py-16">
      <div className="card grid gap-6 bg-gradient-to-br from-brand-50 to-white md:grid-cols-3 md:items-center">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Handshake className="h-4 w-4 text-brand-600" />
            {t("donate.becomePartner")}
          </div>
          <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-brand-700">
            {t("donate.partnerTitle")}
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            {t("donate.partnerDesc")}
          </p>

          <ul className="mt-4 grid gap-3 text-xs text-ink-muted sm:grid-cols-2">
            {projectTypes.map(pt => {
              const Icon = pt.icon;
              return (
                <li key={pt.label} className="flex items-start gap-2">
                  <Icon className={`mt-0.5 h-4 w-4 flex-none ${pt.color}`} />
                  <span>
                    <span className="font-semibold text-ink">{t(pt.label)}</span>
                    {" · "}{t(pt.desc)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-col items-stretch gap-2">
          <a href="mailto:info@jagasemesta.id" className="btn-primary justify-center">
            {t("donate.becomePartnerCta")} <ArrowRight className="h-4 w-4" />
          </a>
          <Link href="/help" className="btn-secondary justify-center">
            {t("donate.downloadDeck")}
          </Link>
        </div>
      </div>
    </section>
  );
}
