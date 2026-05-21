"use client";

import Link from "next/link";
import { Handshake, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function PartnerSection() {
  const { t } = useI18n();

  return (
    <section className="container-page py-16">
      <div className="card flex flex-col items-start gap-4 bg-gradient-to-br from-brand-50 to-white px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Handshake className="h-4 w-4 text-brand-600" />
            {t("donate.becomePartner")}
          </div>
          <h3 className="mt-1 text-lg font-extrabold tracking-tight text-brand-700">
            {t("donate.partnerTitle")}
          </h3>
          <p className="mt-1 max-w-xl text-sm text-ink-muted">
            {t("donate.partnerDesc")}
          </p>
        </div>

        <div className="flex flex-shrink-0 flex-col gap-2">
          <a href="mailto:info@jagasemesta.id" className="btn-primary justify-center whitespace-nowrap text-sm px-4 py-2">
            {t("donate.becomePartnerCta")} <ArrowRight className="h-4 w-4" />
          </a>
          <Link href="/help" className="btn-secondary justify-center whitespace-nowrap text-xs px-4 py-2">
            {t("donate.downloadDeck")}
          </Link>
        </div>
      </div>
    </section>
  );
}
