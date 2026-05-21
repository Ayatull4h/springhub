"use client";
import { useState } from "react";
import { Heart, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { DONATION_TIERS } from "@/lib/xendit";

const TIER_ICONS: Record<string, string> = { seedling: "🌱", trench: "🛠️", sediment: "🗑️", monitoring: "📊" };

export function DonationCard() {
  const [tierId, setTierId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const tier = DONATION_TIERS.find(t => t.id === tierId);
  const amount = tier?.amountIdr || 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !tier) return;
    setLoading(true); setError("");

    try {
      const { token } = await fetch("/api/csrf").then(r => r.json());
      const res = await fetch("/api/donations/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "x-csrf-token": token } : {}) },
        body: JSON.stringify({ amountIdr: amount, donorName: name, donorEmail: email, tierId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.invoiceUrl) window.open(data.invoiceUrl, "_blank");
      setDone(true);
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  };

  if (done) return (
    <section id="donate" className="container-page py-16">
      <div className="mx-auto max-w-md text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h3 className="mt-3 text-lg font-bold">Permintaan Donasi Dikirim!</h3>
        <p className="text-sm text-ink-muted">Buka halaman Xendit untuk menyelesaikan pembayaran.</p>
      </div>
    </section>
  );

  return (
    <section id="donate" className="container-page py-16">
      <div className="mx-auto max-w-md">
        <h2 className="text-center text-3xl font-extrabold">Donasi <span className="text-brand-600">SpringHub</span></h2>
        <p className="mt-2 text-center text-sm text-ink-muted">Setiap donasi masuk ke project terverifikasi dan dilaporkan langsung oleh relawan.</p>

        <form onSubmit={submit} className="card mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Saya ingin mendukung</label>
            <select value={tierId} onChange={e => setTierId(e.target.value)} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2.5 text-sm" required>
              <option value="">— Pilih dampak —</option>
              {DONATION_TIERS.map(t => (
                <option key={t.id} value={t.id}>{TIER_ICONS[t.id]} {t.impact} • {t.label}</option>
              ))}
            </select>
          </div>

          {tier && (
            <div className="rounded-lg bg-brand-50 p-3 text-center text-sm text-brand-700">
              {TIER_ICONS[tier.id]} Kamu akan mendanai <strong>{tier.impact}</strong> sebesar <strong>{tier.label}</strong>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="Nama *" className="rounded-md border border-ink-line px-3 py-2 text-sm" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (opsional)" className="rounded-md border border-ink-line px-3 py-2 text-sm" />
          </div>

          {error && <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4" /> {error}</div>}

          <button type="submit" disabled={loading || !name || !tier} className="btn-primary w-full justify-center text-base">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Heart className="h-5 w-5" /> Donasi {amount > 0 ? `Rp ${amount.toLocaleString("id-ID")}` : ""}</>}
          </button>

          <p className="text-center text-[11px] text-ink-subtle">OVO • GoPay • DANA • QRIS • Kartu • VA</p>
        </form>
      </div>
    </section>
  );
}
