"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function Hero() {
  const { t } = useI18n();

  return (
    <section className="container-page grid gap-10 pt-12 pb-16 md:grid-cols-2 md:items-center md:pt-20">
      <div>
        <h1
          className="text-4xl font-extrabold leading-tight tracking-tight text-brand-700 md:text-5xl"
          dangerouslySetInnerHTML={{ __html: t("hero.title") }}
        />
        <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-muted md:text-lg">
          {t("hero.subtitle")}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="#map" className="btn-primary px-5 py-3 text-base">
            {t("hero.cta.start")}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="https://jagasemesta.id"
            className="btn-secondary px-5 py-3 text-base"
          >
            {t("hero.cta.back")}
            <ArrowRight className="h-4 w-4" />
          </Link>

        </div>
      </div>

      <div className="relative aspect-video overflow-hidden rounded-2xl border border-ink-line bg-slate-900 shadow-card dark:border-slate-700">
        <iframe
          className="absolute inset-0 h-full w-full"
          src="https://www.youtube.com/embed/oUDA1loE8BE?rel=0&modestbranding=1"
          title="Jaga Semesta · SpringHub"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </section>
  );
}
