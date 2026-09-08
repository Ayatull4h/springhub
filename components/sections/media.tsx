"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, Video, CalendarDays, FileText, Newspaper, ChevronLeft, ChevronRight } from "lucide-react";
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

const mediaStyles: Record<string, { gradient: string; icon: React.ReactNode; label: string }> = {
  video: {
    gradient: "from-rose-600/90 to-rose-800/90",
    icon: <Video className="h-10 w-10 text-white/80" />,
    label: "Video",
  },
  event: {
    gradient: "from-amber-600/90 to-amber-800/90",
    icon: <CalendarDays className="h-10 w-10 text-white/80" />,
    label: "Event",
  },
  publication: {
    gradient: "from-blue-600/90 to-blue-800/90",
    icon: <FileText className="h-10 w-10 text-white/80" />,
    label: "Publication",
  },
  press: {
    gradient: "from-purple-600/90 to-purple-800/90",
    icon: <Newspaper className="h-10 w-10 text-white/80" />,
    label: "Press",
  },
};

function getYoutubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([^&\s?/]+)/);
  return match ? match[1] : null;
}

function getYoutubeThumb(url: string): string | null {
  const id = getYoutubeId(url);
  return id ? `/api/ytthumb?videoId=${id}&quality=maxresdefault` : null;
}

function getYoutubeFallback(url: string): string | null {
  const id = getYoutubeId(url);
  return id ? `/api/ytthumb?videoId=${id}&quality=hqdefault` : null;
}

function MediaThumb({ item }: { item: MediaItem }) {
  const imgSrc = item.imageUrl || getYoutubeThumb(item.linkUrl);
  const [useFallback, setUseFallback] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(imgSrc);
  const style = mediaStyles[item.type] || mediaStyles.video;

  useEffect(() => {
    setUseFallback(false);
    setCurrentSrc(imgSrc);
  }, [imgSrc]);

  if (currentSrc && !useFallback) {
    return <img
      src={currentSrc}
      alt={item.title}
      className="h-full w-full object-cover transition group-hover:scale-105"
      loading="lazy"
      onError={() => {
        const fallback = getYoutubeFallback(item.linkUrl);
        if (fallback && currentSrc !== fallback) {
          setCurrentSrc(fallback);
        } else {
          setUseFallback(true);
        }
      }}
    />;
  }

  return (
    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${style.gradient}`}>
      <div className="flex flex-col items-center gap-2">
        {style.icon}
        <span className="text-xs font-semibold uppercase tracking-wider text-white/70">{style.label}</span>
      </div>
    </div>
  );
}

export function MediaSection() {
  const { t } = useI18n();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const hoveringRef = useRef(false);
  const lastInteractRef = useRef(0);
  const touchRef = useRef<number | null>(null);
  const [isSm, setIsSm] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const upd = () => setIsSm(mq.matches);
    upd();
    mq.addEventListener("change", upd);
    return () => mq.removeEventListener("change", upd);
  }, []);

  useEffect(() => {
    fetch("/api/content?section=media")
      .then(r => r.json())
      .then(data => setItems(data.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Jarak melingkar terpendek dari kartu aktif, mis. 5 item → {-2..+2}
  const offsetOf = (i: number) => {
    const n = items.length;
    let o = (i - page + n) % n;
    if (o > Math.floor(n / 2)) o -= n;
    return o;
  };

  const goTo = useCallback((p: number) => {
    if (items.length === 0) return;
    lastInteractRef.current = Date.now();
    setPage(((p % items.length) + items.length) % items.length);
  }, [items.length]);

  const goPrev = () => goTo(page - 1);
  const goNext = useCallback(() => goTo(page + 1), [page, goTo]);

  // Roda jalan sendiri tiap 5 detik, berhenti saat disentuh/hover
  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => {
      if (document.hidden || hoveringRef.current) return;
      if (Date.now() - lastInteractRef.current < 10000) return;
      setPage((p) => (p + 1) % items.length);
    }, 5000);
    return () => clearInterval(id);
  }, [items.length]);

  // Geometri bianglala: kartu menempel di busur (samping naik),
  // tapi tetap tegak seperti kabin — tidak dimiringkan
  const geom = (o: number) => {
    const gap = isSm ? 168 : 150;
    const abs = Math.abs(o);
    return {
      x: o * gap,
      y: o * o * 12,
      scale: 1 - abs * 0.1,
      z: 10 - abs,
      opacity: 1 - abs * 0.12,
      bright: 1 - abs * 0.1,
    };
  };

  const typeColors: Record<string, string> = {
    video: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    event: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    publication: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    press: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
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
          <p>{t("media.empty", "No media content yet. Check back soon!")}</p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center justify-end gap-2">
            <span className="mr-auto text-xs text-ink-subtle">
              {page + 1} / {items.length}
            </span>
            <button
              onClick={goPrev}
              className="rounded-full border border-ink-line p-2 text-ink-muted transition hover:bg-slate-100 hover:text-ink dark:hover:bg-slate-700 dark:hover:text-white"
              aria-label="Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goNext}
              className="rounded-full border border-ink-line p-2 text-ink-muted transition hover:bg-slate-100 hover:text-ink dark:hover:bg-slate-700 dark:hover:text-white"
              aria-label="Berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div
            className="relative mt-4 h-[360px] overflow-hidden [perspective:1200px] sm:h-[380px]"
            onMouseEnter={() => { hoveringRef.current = true; }}
            onMouseLeave={() => { hoveringRef.current = false; lastInteractRef.current = Date.now(); }}
            onTouchStart={(e) => { touchRef.current = e.touches[0].clientX; hoveringRef.current = true; }}
            onTouchEnd={(e) => {
              hoveringRef.current = false;
              const dx = e.changedTouches[0].clientX - (touchRef.current ?? 0);
              if (Math.abs(dx) > 40) goTo(page + (dx < 0 ? 1 : -1));
              else lastInteractRef.current = Date.now();
            }}
          >
            <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-8 bg-gradient-to-r from-white to-transparent dark:from-slate-900" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-8 bg-gradient-to-l from-white to-transparent dark:from-slate-900" />
            {items.map((item, i) => {
              const o = offsetOf(i);
              const g = geom(o);
              const external = item.linkUrl && item.linkUrl.startsWith("http");
              return (
                <div
                  key={item.id}
                  data-media-card
                  className="absolute left-1/2 top-2"
                  style={{
                    zIndex: g.z,
                    opacity: g.opacity,
                    filter: `brightness(${g.bright})`,
                    transform: `translate(-50%, 0) translate(${g.x}px, ${g.y}px) scale(${g.scale})`,
                    transition: "transform .6s cubic-bezier(.25,.8,.25,1), opacity .6s, filter .6s",
                  }}
                >
                  <div
                    role="button"
                    tabIndex={o === 0 ? 0 : -1}
                    aria-label={item.title}
                    onClick={() => {
                      if (o !== 0) { goTo(i); return; }
                      if (item.linkUrl) window.open(item.linkUrl, item.linkUrl.startsWith("http") ? "_blank" : "_self", "noreferrer");
                    }}
                    onKeyDown={(e) => { if (o !== 0 && (e.key === "Enter" || e.key === " ")) goTo(i); }}
                    className={`card group block w-[220px] ${o !== 0 ? "cursor-pointer" : ""} sm:w-[240px]`}
                  >
                    <div className="-mx-4 -mt-4 mb-3 h-28 overflow-hidden rounded-t-xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-900/50">
                      <MediaThumb item={item} />
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
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => { goTo(i); }}
                className={`h-2 rounded-full transition-all ${i === page ? "w-6 bg-brand-600" : "w-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600"}`}
                aria-label={`Ke slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}

    </section>
  );
}
