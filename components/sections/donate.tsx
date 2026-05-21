"use client";

import { useState } from "react";
import { Heart, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { DONATION_TIERS } from "@/lib/xendit";

const tierIcons: Record<string, string> = {
  seedling: "🌱",
  trench: "🛠️",
  sediment: "🗑️",
  monitoring: "📊",
};

export function DonateSection() {
  const [tierId, setTierId] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ invoiceUrl: string } | null>(null);

  const selectedTier = DONATION_TIERS.find(t => t.id === tierId);
  const amountIdr = customAmount ? parseInt(customAmount) : (selectedTier?.amountIdr || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!donorName.trim() || amountIdr < 1000) return;
    setLoading(true);
    setError("");

    try {
      const csrfRes = await fetch("/api/csrf");
      const { token } = await csrfRes.json();

      const res = await fetch("/api/donations/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "x-csrf-token": token } : {}) },
        body: JSON.stringify({ amountIdr, donorName: donorName.trim(), donorEmail, tierId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");

      if (data.invoiceUrl) {
        window.open(data.invoiceUrl, "_blank");
        setSuccess({ invoiceUrl: data.invoiceUrl });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="donate" className="container-page py-16">
      <div className="mx-auto max-w-md">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">
          Donasi <span className="text-brand-600">SpringHub</span>
        </h2>
        <p className="mt-2 text-center text-sm text-ink-muted">
          Setiap donasi masuk ke project yang terverifikasi dan dilaporkan langsung oleh relawan lapangan.
        </p>

        {success ? (
          <div className="card mt-6 text-center py-8">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h3 className="mt-3 text-lg font-bold text-ink">Permintaan Donasi Dikirim!</h3>
            <p className="mt-1 text-sm text-ink-muted">Buka halaman Xendit untuk menyelesaikan pembayaran.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-ink">Saya ingin mendukung</label>
              <div className="relative mt-1">
                <select
                  value={tierId}
                  onChange={e => { setTierId(e.target.value); setCustomAmount(""); }}
                  className="w-full appearance-none rounded-md border border-ink-line bg-white px-3 py-2.5 pr-8 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
                  required
                >
                  <option value="">— Pilih dampak Anda —</option>
                  {DONATION_TIERS.map(t => (
                    <option key={t.id} value={t.id}>
                      {tierIcons[t.id] || "•"} {t.impact} • {t.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted">▼</span>
              </div>
            </div>

            {selectedTier && (
              <div className="rounded-lg bg-brand-50 p-3 text-center text-sm text-brand-700">
                {tierIcons[selectedTier.id]} Kamu akan mendanai <strong>{selectedTier.impact}</strong>
                <br />sebesar <strong>{selectedTier.label}</strong>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-ink-muted">Nama *</label>
                <input required value={donorName} onChange={e => setDonorName(e.target.value)} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm" placeholder="Nama Anda" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Email</label>
                <input type="email" value={donorEmail} onChange={e => setDonorEmail(e.target.value)} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm" placeholder="opsional" />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !donorName.trim() || amountIdr < 1000}
              className="btn-primary w-full justify-center text-base"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <><Heart className="h-5 w-5" /> Donasi {amountIdr > 0 ? `Rp ${amountIdr.toLocaleString("id-ID")}` : ""}</>
              )}
            </button>

            <p className="text-center text-[11px] text-ink-subtle">
              Pembayaran: OVO • GoPay • DANA • QRIS • Kartu Kredit • Virtual Account
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
