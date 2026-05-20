"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, Video, CalendarDays, FileText, Newspaper } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type MediaItem = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  linkLabel: string;
};

export function MediaSection() {
  const { t } = useI18n();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/content?section=media")
      .then(r => r.json())
      .then(data => setItems(data.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const typeColors: Record<string, string> = {
    video: "bg-rose-100 text-rose-700",
    event: "bg-amber-100 text-amber-700",
    publication: "bg-blue-100 text-blue-700",
    press: "bg-purple-100 text-purple-700",
  };

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

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-40 rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="mt-3 h-4 w-16 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-2 h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-1 h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 text-center text-ink-muted">
          <p>No media content yet. Check back soon!</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => {
            const external = item.linkUrl && item.linkUrl.startsWith("http");
            return (
              <Link
                key={item.id}
                href={item.linkUrl || "#"}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                className="card group transition hover:-translate-y-1"
              >
                <div className="-mx-4 -mt-4 mb-3 flex h-32 items-center justify-center rounded-t-xl bg-gradient-to-br from-brand-50 to-brand-100">
                  {item.type === "video" && <Video className="h-12 w-12 text-rose-500" />}
                  {item.type === "event" && <CalendarDays className="h-12 w-12 text-amber-500" />}
                  {item.type === "publication" && <FileText className="h-12 w-12 text-blue-500" />}
                  {item.type === "press" && <Newspaper className="h-12 w-12 text-purple-500" />}
                </div>
                <span className={`chip text-xs ${typeColors[item.type] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>
                  {item.type}
                </span>
                <h3 className="mt-2 text-sm font-semibold text-ink">{item.title}</h3>
                {item.subtitle && (
                  <p className="mt-0.5 text-xs text-ink-muted">{item.subtitle}</p>
                )}
                <p className="mt-1 line-clamp-2 text-xs text-ink-subtle">{item.description}</p>
                {item.linkLabel && (
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600">
                    {item.linkLabel} <ArrowRight className="h-3 w-3" />
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
