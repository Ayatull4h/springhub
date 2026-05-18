"use client";

import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  ExternalLink,
  FileText,
  Newspaper,
  PlayCircle,
} from "lucide-react";
import { mediaItems, type MediaItem } from "@/lib/data";
import { useI18n } from "@/lib/i18n";

const typeMeta: Record<MediaItem["type"], { Icon: typeof PlayCircle; chip: string }> = {
  Video: {
    Icon: PlayCircle,
    chip: "bg-red-50 text-red-700 ring-1 ring-red-200",
  },
  Event: {
    Icon: Calendar,
    chip: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  },
  Publication: {
    Icon: FileText,
    chip: "bg-brand-50 text-brand-700 ring-1 ring-brand-200",
  },
  Press: {
    Icon: Newspaper,
    chip: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  },
};

export function MediaSection() {
  const { t } = useI18n();

  return (
    <section id="media" className="container-page py-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            {t("media.title")}{" "}
            <span className="text-brand-600">{t("media.titleAccent")}</span>
          </h2>
          <p className="mt-2 max-w-2xl text-ink-muted">
            {t("media.description")}
          </p>
        </div>
        <Link
          href="https://youtube.com/@jagasemesta"
          target="_blank"
          rel="noreferrer"
          className="btn-secondary"
        >
          {t("media.visitYoutube")}
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mediaItems.map((m) => {
          const meta = typeMeta[m.type];
          const Icon = meta.Icon;
          const external = m.href.startsWith("http");
          return (
            <article key={m.title} className="card flex flex-col">
              <div className="grid aspect-[16/9] place-items-center rounded-lg bg-gradient-to-br from-emerald-50 to-sky-50">
                <Icon className="h-8 w-8 text-brand-600/70" />
              </div>
              <span className={`chip mt-4 self-start ${meta.chip}`}>
                <Icon className="h-3 w-3" />
                {m.type}
              </span>
              <h3 className="mt-2 text-base font-semibold leading-snug text-ink">
                {m.title}
              </h3>
              <div className="mt-1 text-xs text-ink-subtle">{m.date}</div>
              <p className="mt-2 line-clamp-3 text-sm text-ink-muted">{m.summary}</p>
              <Link
                href={m.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-brand-700 hover:underline"
              >
                {m.cta}
                {external ? (
                  <ExternalLink className="h-3.5 w-3.5" />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5" />
                )}
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
