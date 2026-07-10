"use client";

import { useState } from "react";
import { Heart, CheckCircle2, Loader2, Sprout, Layers, Droplets, Telescope } from "lucide-react";
import { DONATION_TIERS } from "@/lib/xendit";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";

const tierIcons: Record<string, React.ReactNode> = {
  seedling: <Sprout className="h-4 w-4 text-emerald-600" />,
  trench: <Layers className="h-4 w-4 text-amber-600" />,
  sediment: <Droplets className="h-4 w-4 text-blue-600" />,
  monitoring: <Telescope className="h-4 w-4 text-purple-600" />,
};

export function DonateSection() {
  const { t } = useI18n();
  const [tierId, setTierId] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const tier = DONATION_TIERS.find(t => t.id === tierId);
  const effectiveAmount = tierId === "custom" ? (parseInt(customAmount) || 0) : (tier?.amountIdr ?? 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    if (tierId === "custom" && (!customAmount || parseInt(customAmount) < 1000)) {
      setError("Minimum donasi Rp 1.000");
      return;
    }
    setLoading(true); setError("");

    try {
      const { token } = await fetch("/api/csrf").then(r => r.json());
      const res = await fetch("/api/donations/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "x-csrf-token": token } : {}) },
        body: JSON.stringify({ amountIdr: effectiveAmount, donorName: name, donorEmail: email, tierId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.invoiceUrl) window.open(data.invoiceUrl, "_blank");
      setDone(true);
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  };

  if (done) return (
    <div id="donate">
      <div>
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        <h3 className="mt-4 text-xl font-bold">Permintaan Donasi Terkirim</h3>
        <p className="mt-2 text-sm text-ink-muted">Silakan selesaikan pembayaran di halaman Xendit yang terbuka.</p>
      </div>
    </div>
  );

  return (
    <div id="donate">
      <div>
        <div className="mb-4 flex items-center gap-6 text-sm">
          <div>
            <p className="text-xs text-ink-muted">Terkumpul</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Rp 48,2 Juta</p>
          </div>
          <div className="h-8 w-px bg-ink-line" />
          <div>
            <p className="text-xs text-ink-muted">Donatur</p>
            <p className="text-lg font-bold text-ink">324</p>
          </div>
          <div className="h-8 w-px bg-ink-line" />
          <div>
            <p className="text-xs text-ink-muted">Proyek</p>
            <p className="text-lg font-bold text-ink">12</p>
          </div>
        </div>

        <h3 className="text-base font-semibold text-ink">Donasi Sekarang</h3>

        <form onSubmit={submit} className="mt-3 space-y-3">
          <div>
            <select
              value={tierId}
              onChange={e => { setTierId(e.target.value); setError(""); }}
              className="w-full rounded-lg border border-ink-line bg-white px-3.5 py-2.5 text-sm dark:bg-slate-800"
              required
            >
              <option value="">{t("donate.chooseImpact")}</option>
              {DONATION_TIERS.map(t => (
                <option key={t.id} value={t.id}>{t.impact}</option>
              ))}
              <option value="custom">{t("donate.customOption")}</option>
            </select>
          </div>

          {tier && (
            <div className="rounded-lg bg-brand-50 px-3.5 py-2.5 text-sm text-brand-800 dark:bg-brand-900/30 dark:text-brand-300">
              {tierIcons[tier.id]} <strong>{tier.impact}</strong> — {tier.label}
            </div>
          )}

          {tierId === "custom" && (
            <input
              type="number"
              value={customAmount}
              onChange={e => setCustomAmount(e.target.value)}
              className="w-full rounded-lg border border-ink-line px-3.5 py-2.5 text-sm dark:bg-slate-800"
              placeholder="Jumlah donasi (Rp)"
              min={1000}
              required
            />
          )}

          <div className="flex gap-2">
            <input
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 min-w-0 rounded-lg border border-ink-line bg-white px-3 py-2 text-sm dark:bg-slate-800"
              placeholder="Nama Anda"
            />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="flex-1 min-w-0 rounded-lg border border-ink-line bg-white px-3 py-2 text-sm dark:bg-slate-800"
              placeholder="Email"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name || (tierId !== "custom" && !tier) || (tierId === "custom" && !customAmount)}
            className="btn-primary w-full justify-center gap-2 py-2.5 text-sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <><Heart className="h-4 w-4" /> {effectiveAmount > 0 ? `Rp ${effectiveAmount.toLocaleString("id-ID")}` : t("donate.continue")}</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
