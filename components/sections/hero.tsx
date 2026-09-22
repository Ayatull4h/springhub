"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { LiteYouTubeEmbed } from "@/components/lite-youtube-embed";
import { WaderIcon, UcengIcon } from "./eco-icons";
import { LilyPad } from "./river-ornaments";
import { BkkSticker } from "./bkk-decor";

const STONES = [
  "left-[6%] top-[18%] h-10 w-12",
  "left-[2%] top-[46%] h-14 w-16",
  "left-[8%] top-[74%] h-9 w-11",
  "right-[5%] top-[14%] h-12 w-14",
  "right-[2%] top-[44%] h-9 w-11",
  "right-[7%] top-[72%] h-14 w-16",
  "left-[20%] top-[6%] h-8 w-10",
  "right-[22%] top-[8%] h-8 w-10",
];

export function Hero() {
  const { t } = useI18n();

  return (
    <section className="container-page relative overflow-x-clip pt-12 pb-16 md:pt-20">
      {/* cahaya lembut di langit kolam */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-sky-200/60 blur-3xl dark:bg-sky-900/40" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-tang-200/50 blur-3xl dark:bg-tang-700/20" />
      {/* KUBANGAN: satu kolam berisi judul + video */}
      <div className="relative rounded-[46%_54%_52%_48%/8%_10%_7%_9%] bg-gradient-to-b from-sky-200 via-lagoon-500 to-sky-500 px-6 py-14 md:px-14 md:py-20 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900">
        {/* bingkai dalam kolam */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-3 rounded-[46%_54%_52%_48%/10%_12%_9%_11%] border-2 border-white/40" />
        {/* riak konsentris */}
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-10 h-24 w-2/3 -translate-x-1/2 rounded-[50%] border-4 border-white/40" />
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-6 h-16 w-1/2 -translate-x-1/2 rounded-[50%] border-2 border-white/30" />
        {/* kerikil tepi kolam */}
        {STONES.map((pos, i) => (
          <div
            key={i}
            aria-hidden="true"
            className={`pointer-events-none absolute rounded-[55%_45%_58%_42%/50%_55%_45%_52%] bg-gradient-to-br from-stone-300 to-stone-400 shadow-md dark:from-slate-600 dark:to-slate-700 ${pos}`}
          />
        ))}
        {/* ikan + teratai di kolam */}
        <WaderIcon className="pointer-events-none absolute bottom-10 left-[10%] hidden w-20 -rotate-6 opacity-90 md:block" />
        <UcengIcon className="pointer-events-none absolute right-[9%] top-16 hidden w-16 rotate-6 opacity-90 md:block" />
        <LilyPad className="pointer-events-none absolute bottom-6 right-[16%] hidden w-24 rotate-6 opacity-90 md:block" />
        <LilyPad className="pointer-events-none absolute left-[16%] top-8 hidden w-16 -rotate-12 opacity-80 md:block" />
        <BkkSticker tilt="rotate-3" className="pointer-events-none absolute left-[4%] top-5 hidden text-xs md:inline-flex">
          {t("hero.badge", "100% Komunitas")}
        </BkkSticker>

        <div className="relative grid items-center gap-10 md:grid-cols-2">
          <div>
            <h1
              className="font-display text-4xl font-bold leading-tight tracking-tight text-sky-950 md:text-6xl dark:text-white"
              dangerouslySetInnerHTML={{ __html: t("hero.title") }}
            />
            <p className="mt-6 max-w-xl text-base leading-relaxed text-sky-950/80 md:text-lg dark:text-slate-300">
              {t("hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="#map"
                className="rounded-[60%_40%_55%_45%/55%_45%_60%_40%] bg-sky-800 px-7 py-3.5 font-display text-base font-bold text-white shadow-[5px_5px_0_rgba(8,47,73,0.9)] ring-2 ring-white/50 transition hover:rotate-0 hover:scale-[1.03] -rotate-1"
              >
                {t("hero.cta.start")}
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </Link>
              <Link
                href="https://jagasemesta.org/"
                className="rounded-[40%_60%_45%_55%/45%_55%_40%_60%] bg-cream px-7 py-3.5 font-display text-base font-bold text-sky-950 shadow-[5px_5px_0_rgba(8,47,73,0.9)] ring-2 ring-white/60 transition hover:rotate-0 hover:scale-[1.03] rotate-1 dark:bg-slate-800 dark:text-white"
              >
                {t("hero.cta.back")}
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-video overflow-hidden rounded-[45%_55%_50%_50%/30%_32%_28%_30%] bg-sky-950 shadow-elevated ring-4 ring-white/70 dark:ring-slate-700">
              <LiteYouTubeEmbed videoId="oUDA1loE8BE" title="Jaga Semesta · SpringHub" />
            </div>
          </div>
        </div>

        {/* Mobile fallback — YouTube link */}
        <a href="https://www.youtube.com/watch?v=oUDA1loE8BE" target="_blank" rel="noreferrer" className="relative mt-4 inline-flex items-center gap-1 text-xs font-semibold text-sky-900 hover:text-sky-700 md:hidden dark:text-slate-300">
          <span aria-hidden="true">▶️</span> Tonton di YouTube
        </a>
      </div>
    </section>
  );
}
