"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { BkkCurve } from "./bkk-decor";

const HERO_IMG =
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=2000&q=70";

export function Hero() {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden bg-bkk-900">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={HERO_IMG}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-bkk-900/70 via-bkk-900/35 to-bkk-900/75"
      />
      <div className="container-page relative flex min-h-[78vh] flex-col items-center justify-center py-24 text-center md:min-h-[86vh]">
        <h1
          className="max-w-4xl font-display text-5xl font-bold leading-[1.05] tracking-tight text-white drop-shadow-lg md:text-7xl"
          dangerouslySetInnerHTML={{ __html: t("hero.title") }}
        />
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/90 md:text-xl">
          {t("hero.subtitle")}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="#map"
            className="rounded-full bg-bkk-700 px-8 py-3.5 font-display text-base font-bold text-white shadow-[0_8px_24px_rgba(103,39,159,0.5)] transition hover:bg-bkk-800"
          >
            {t("hero.cta.start")}
            <ArrowRight className="ml-2 inline h-4 w-4" />
          </Link>
          <Link
            href="https://jagasemesta.org/"
            className="rounded-full bg-white/95 px-8 py-3.5 font-display text-base font-bold text-bkk-800 shadow-lg transition hover:bg-white"
          >
            {t("hero.cta.back")}
            <ArrowRight className="ml-2 inline h-4 w-4" />
          </Link>
        </div>
      </div>
      <BkkCurve top="bg-transparent" bottom="text-bkk-700" accent="text-bkk-200" />
    </section>
  );
}
