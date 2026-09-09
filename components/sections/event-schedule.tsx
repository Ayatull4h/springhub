"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useCallback, useRef } from "react";
import { CalendarDays, MapPin, Users, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type EventItem = {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  googleFormUrl: string;
  imageUrl: string;
  _count?: { registrations: number };
};

function fmtDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(locale === "id" ? "id-ID" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function EventThumb({ item }: { item: EventItem }) {
  if (!item.imageUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-teal-600/90 to-emerald-800/90">
        <CalendarDays className="h-10 w-10 text-white/80" />
      </div>
    );
  }
  return <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" loading="lazy" />;
}

function RegisterPopup({ event, onClose }: { event: EventItem; onClose: () => void }) {
  const [form, setForm] = useState({ nama: "", domisili: "", hari: "1", wa: "", email: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [t0] = useState(() => Date.now());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const { token } = await fetch("/api/csrf").then((r) => r.json());
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ ...form, _submit_time: t0, _website: "" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDone(true);
      } else if (data.details) {
        setError(Object.entries(data.details).map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`).join("; "));
      } else {
        setError(data.error || "Gagal mendaftar");
      }
    } catch {
      setError("Gagal mendaftar. Periksa koneksi lalu coba lagi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4" onClick={onClose}>
      <div className="my-8 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="py-8 text-center">
            <h3 className="text-lg font-bold text-ink">Pendaftaran terkirim!</h3>
            <p className="mt-2 text-sm text-ink-muted">
              Kamu akan menerima email pengingat H-1 sebelum acara. Sampai jumpa di lokasi!
            </p>
            <button onClick={onClose} className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              Tutup
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink">Daftar: {event.title}</h3>
                <p className="text-xs text-ink-muted">{event.location}</p>
              </div>
              <button onClick={onClose} className="rounded p-1 text-ink-subtle hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Tutup">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={submit} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-ink-muted">Nama lengkap</label>
                <input required value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm dark:bg-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Domisili saat ini</label>
                <input value={form.domisili} onChange={(e) => setForm({ ...form, domisili: e.target.value })} placeholder="cth: Boyolali" className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm dark:bg-slate-800 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-ink-muted">Ikut berapa hari</label>
                  <input required type="number" min={1} max={30} value={form.hari} onChange={(e) => setForm({ ...form, hari: e.target.value })} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm dark:bg-slate-800 dark:text-white" />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-muted">No. WA</label>
                  <input required value={form.wa} onChange={(e) => setForm({ ...form, wa: e.target.value })} placeholder="0812..." className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm dark:bg-slate-800 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Email (untuk pengingat H-1)</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm dark:bg-slate-800 dark:text-white" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={sending} className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
                {sending ? "Mengirim..." : "Kirim Pendaftaran"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export function EventSchedule() {
  const { t, locale } = useI18n();
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [popup, setPopup] = useState<EventItem | null>(null);
  const hoveringRef = useRef(false);
  const lastInteractRef = useRef(0);
  const touchRef = useRef<number | null>(null);
  const [isSm, setIsSm] = useState(false);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => setItems(d.events || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const upd = () => setIsSm(mq.matches);
    upd();
    mq.addEventListener("change", upd);
    return () => mq.removeEventListener("change", upd);
  }, []);

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

  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => {
      if (document.hidden || hoveringRef.current) return;
      if (Date.now() - lastInteractRef.current < 10000) return;
      setPage((p) => (p + 1) % items.length);
    }, 5000);
    return () => clearInterval(id);
  }, [items.length]);

  const geom = (o: number) => {
    const gap = isSm ? 204 : 182;
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

  if (loading) return null;

  if (items.length === 0) {
    return (
      <section id="jadwal" className="container-page py-16">
        <h2 className="text-center text-3xl font-extrabold tracking-tight md:text-4xl">
          {t("event.title", "Jadwal")} <span className="text-brand-600">{t("event.titleAccent", "Mendatang")}</span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-ink-muted">
          {t("event.empty", "Belum ada jadwal. Pantau terus — restorasi dan tanam pohon berikutnya segera diumumkan.")}
        </p>
      </section>
    );
  }

  return (
    <section id="jadwal" className="container-page py-16">
      <h2 className="text-center text-3xl font-extrabold tracking-tight md:text-4xl">
        {t("event.title", "Jadwal")} <span className="text-brand-600">{t("event.titleAccent", "Mendatang")}</span>
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-ink-muted">
        {t("event.description", "Ikut restorasi mata air dan tanam pohon bulan depan. Daftar langsung, tanpa kuota.")}
      </p>

      <div className="mt-4 flex items-center justify-end gap-2">
        <span className="mr-auto text-xs text-ink-muted">{page + 1} / {items.length}</span>
        <button onClick={goPrev} className="rounded-full border border-ink-line p-2 text-ink-muted transition hover:bg-slate-100 hover:text-ink dark:hover:bg-slate-700 dark:hover:text-white" aria-label="Sebelumnya">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button onClick={goNext} className="rounded-full border border-ink-line p-2 text-ink-muted transition hover:bg-slate-100 hover:text-ink dark:hover:bg-slate-700 dark:hover:text-white" aria-label="Berikutnya">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div
        className="relative mt-4 h-[400px] overflow-hidden [perspective:1200px] sm:h-[420px]"
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
        {items.map((item, i) => {
          const o = offsetOf(i);
          const g = geom(o);
          const ended = new Date(item.endDate) < new Date();
          return (
            <div
              key={item.id}
              data-event-card
              className="absolute left-1/2 top-2"
              style={{
                zIndex: g.z,
                opacity: g.opacity,
                filter: `brightness(${g.bright})`,
                transform: `translate(-50%, 0) translate(${g.x}px, ${g.y}px) scale(${g.scale})`,
                transition: "transform .6s cubic-bezier(.25,.8,.25,1), opacity .6s, filter .6s",
              }}
            >
              {/* Kaca glassmorphism */}
              <div className="w-[266px] overflow-hidden rounded-2xl border border-white/40 bg-white/60 shadow-xl backdrop-blur-md dark:border-slate-600/50 dark:bg-slate-800/60 sm:w-[290px]">
                <div className="h-28 overflow-hidden">
                  <EventThumb item={item} />
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-ink">{item.title}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
                    <CalendarDays className="h-3 w-3" />
                    {fmtDate(item.startDate, locale)} — {fmtDate(item.endDate, locale)}
                  </p>
                  {item.location && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
                      <MapPin className="h-3 w-3" /> {item.location}
                    </p>
                  )}
                  {typeof item._count?.registrations === "number" && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-subtle">
                      <Users className="h-3 w-3" /> {item._count.registrations} pendaftar
                    </p>
                  )}
                  {ended ? (
                    <button disabled className="mt-3 w-full cursor-not-allowed rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-500 dark:bg-slate-700">
                      Selesai
                    </button>
                  ) : item.googleFormUrl ? (
                    <a href={item.googleFormUrl} target="_blank" rel="noreferrer" className="mt-3 block w-full rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-brand-700">
                      Daftar
                    </a>
                  ) : (
                    <button onClick={() => setPopup(item)} className="mt-3 w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                      Daftar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5">
        {items.map((it, i) => (
          <button
            key={it.id}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all ${i === page ? "w-6 bg-brand-600" : "w-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600"}`}
            aria-label={`Ke slide ${i + 1}`}
          />
        ))}
      </div>

      {popup && <RegisterPopup event={popup} onClose={() => setPopup(null)} />}
    </section>
  );
}
