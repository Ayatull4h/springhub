"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { LiteYouTubeEmbed } from "@/components/lite-youtube-embed";
import { BkkCloudWrap } from "./bkk-decor";

export function Hero() {
  const { t } = useI18n();

  return (
    <section className="container-page grid gap-10 pt-12 pb-16 md:grid-cols-2 md:items-center md:pt-20">
      <div>
        <h1
          className="font-display text-4xl font-bold leading-tight tracking-tight text-bkk-700 md:text-6xl dark:text-white"
          dangerouslySetInnerHTML={{ __html: t("hero.title") }}
        />
        <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-muted md:text-lg">
          {t("hero.subtitle")}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="#map"
            className="rounded-full bg-bkk-700 px-7 py-3.5 font-display text-base font-bold text-white shadow-[5px_5px_0_rgba(61,22,96,0.9)] ring-2 ring-white/50 transition hover:rotate-0 hover:scale-[1.03] -rotate-1"
          >
            {t("hero.cta.start")}
            <ArrowRight className="ml-2 inline h-4 w-4" />
          </Link>
          <Link
            href="https://jagasemesta.org/"
            className="rounded-full bg-cream px-7 py-3.5 font-display text-base font-bold text-bkk-800 shadow-[5px_5px_0_rgba(61,22,96,0.9)] ring-2 ring-tang-200 transition hover:rotate-0 hover:scale-[1.03] rotate-1 dark:bg-slate-800 dark:text-white"
          >
            {t("hero.cta.back")}
            <ArrowRight className="ml-2 inline h-4 w-4" />
          </Link>
        </div>
      </div>

      <BkkCloudWrap boxClassName="aspect-video overflow-hidden rounded-[2.5rem_3.5rem_2rem_3rem] bg-slate-900 shadow-elevated ring-4 ring-tang-200 dark:ring-slate-700" tone="lagoon" side="right" size="md">
        <LiteYouTubeEmbed videoId="oUDA1loE8BE" title="Jaga Semesta · SpringHub" />
      </BkkCloudWrap>

      {/* Mobile fallback — YouTube link */}
      <a href="https://www.youtube.com/watch?v=oUDA1loE8BE" target="_blank" className="mt-2 inline-flex items-center gap-1 text-xs text-ink-muted hover:text-brand-600 md:hidden">
        ▶️ Tonton di YouTube
      </a>
    </section>
  );
}
