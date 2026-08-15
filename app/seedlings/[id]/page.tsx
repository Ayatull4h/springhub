"use client";
import { useState, useEffect } from "react";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronLeft, MapPin, User, Calendar, Send, Image,
  FileText, Phone, PhoneCall, Sprout,
} from "lucide-react";

type SeedlingDetail = {
  species: string; count: number; available: number;
  province: string; regency: string;
  owner: string; ownerPhone: string; trustScore: number;
  notes: string; createdAt: string;
  height?: string; seedlingForm?: string; readiness?: string;
  photos?: { storagePath: string }[];
};

export default function SeedlingDetailPage() {
  const params = useParams();
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [seedling, setSeedling] = useState<SeedlingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/seedlings/${params.id}`)
      .then(async r => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(data => {
        const s = data.seedling || data;
        const reportPhotos = s.report?.photos || [];
        const seedlingPhotos = s.photos || [];
        const allPhotos = [...reportPhotos, ...seedlingPhotos];
        setSeedling({
          species: s.species || "Bibit",
          count: s.quantity || s.stock || 0,
          available: s.quantity || s.stock || 0,
          province: s.province || "",
          regency: s.regency || "",
          owner: (s.user?.username) || "Petani",
          ownerPhone: s.user?.phone || "",
          trustScore: s.user?.trustScore || 50,
          notes: s.notes || "",
          createdAt: "",
          height: s.height || "",
          seedlingForm: s.seedlingForm || "",
          readiness: s.readiness || "",
          photos: allPhotos.map((p: any) => ({ storagePath: p.storagePath.startsWith("http") ? p.storagePath : `/uploads/${p.storagePath}` })),
        });
      })
      .catch(() => setSeedling(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  const s = seedling || ({} as SeedlingDetail);

  async function handleSubmit() {
    if (qty < 1 || qty > s.available) return;
    setSubmitting(true);
    try {
      const { token } = await fetch("/api/csrf").then(r => r.json());
      const res = await fetch(`/api/seedlings/${params.id}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "x-csrf-token": token } : {}) },
        body: JSON.stringify({ quantity: qty, message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Gagal mengirim permintaan");
        return;
      }
      setSubmitted(true);
    } catch {
      alert("Gagal terhubung ke server. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="container-page py-16 text-center animate-fade">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <Send className="h-7 w-7 text-green-600" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-ink">Permintaan terkirim!</h1>
        <p className="mt-2 text-sm text-ink-muted max-w-md mx-auto">
          Kamu meminta {qty} bibit {s.species} dari {s.owner}. Cek statusnya di Permintaanku.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/seedlings/my-requests" className="btn-primary inline-flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Lihat Permintaanku
          </Link>
          <Link href="/seedlings" className="btn-secondary inline-flex items-center gap-2">
            Kembali
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container-page py-8">
      <Link
        href="/seedlings"
        className="mb-5 inline-flex items-center gap-1 text-sm text-ink-muted transition hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" />
        Kembali
      </Link>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {s.photos && s.photos.length > 0 ? (
            <>
              <div className="flex aspect-[16/10] items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                <img
                  src={s.photos[0].storagePath}
                  alt={s.species}
                  className="h-full w-full object-cover"
                />
              </div>
              {s.photos.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {s.photos.map((p, i) => (
                    <div
                      key={i}
                      className="flex h-14 w-18 min-w-[4.5rem] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-800"
                    >
                      <img src={p.storagePath} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex aspect-[16/10] items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100">
              <Image className="h-10 w-10 text-slate-300" />
            </div>
          )}
          <div className="mt-4 rounded-xl border border-ink-line bg-slate-50 p-4 dark:bg-slate-800">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <FileText className="h-4 w-4 text-green-600" />
              Keterangan
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{s.notes || "Tidak ada catatan"}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:col-span-2">
          <div className="rounded-xl border border-ink-line bg-slate-50 p-4 dark:bg-slate-800">
            <h2 className="text-xl font-bold text-ink">{s.species}</h2>
            <div className="mt-3 grid gap-1.5 text-sm">
              <div className="flex items-center justify-between"><span className="text-ink-muted">Jumlah</span><span className="font-semibold">{s.count} bibit</span></div>
              <div className="flex items-center justify-between"><span className="text-ink-muted">Tersedia</span><span className="font-semibold text-green-600">{s.available} bibit</span></div>
              <hr className="my-1.5 border-ink-line" />
              <div className="flex items-center gap-2 text-ink-muted"><MapPin className="h-3.5 w-3.5" />{s.regency}, {s.province}</div>
              <div className="flex items-center gap-2 text-ink-muted"><User className="h-3.5 w-3.5" />{s.owner} · ⭐ {s.trustScore}</div>
              {s.height && <div className="flex items-center gap-2 text-ink-muted"><span className="h-3.5 w-3.5 flex items-center justify-center text-[10px]">📏</span>Tinggi: {s.height}</div>}
              {s.seedlingForm && <div className="flex items-center gap-2 text-ink-muted"><span className="h-3.5 w-3.5 flex items-center justify-center text-[10px]">🌱</span>Bentuk: {s.seedlingForm}</div>}
              {s.readiness && <div className="flex items-center gap-2 text-ink-muted"><span className="h-3.5 w-3.5 flex items-center justify-center text-[10px]">✅</span>Kesiapan: {s.readiness}</div>}
              {s.ownerPhone && <a href={`https://wa.me/${s.ownerPhone.replace(/[^0-9]/g, '')}`} target="_blank" className="flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700 mt-1"><Phone className="h-3.5 w-3.5" /> WhatsApp</a>}
              <div className="flex items-center gap-2 text-ink-muted"><Calendar className="h-3.5 w-3.5" />{s.createdAt}</div>
            </div>
          </div>

          <div className="rounded-xl border border-ink-line p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <Send className="h-4 w-4 text-green-600" />
              Kirim Permintaan
            </h3>
            <div className="mt-3">
              <label className="text-xs font-medium text-ink-muted">Jumlah bibit</label>
              <input
                type="number"
                value={qty}
                min={1}
                max={s.available}
                onChange={e => setQty(Math.min(Number(e.target.value) || 0, s.available))}
                className="input mt-1"
              />
            </div>
            <div className="mt-3">
              <label className="text-xs font-medium text-ink-muted">Pesan</label>
              <textarea
                value={message}
                rows={3}
                onChange={e => setMessage(e.target.value)}
                placeholder="Contoh: Mau tanam di kebun..."
                className="input mt-1 resize-y"
                style={{ minHeight: "3.5rem" }}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || qty < 1}
              className="btn-primary mt-3 inline-flex w-full items-center justify-center gap-2"
            >
              {submitting ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Mengirim...</>
              ) : (
                <><Send className="h-4 w-4" />Kirim Permintaan</>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
