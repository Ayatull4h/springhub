"use client";

import { useState } from "react";
import { Heart, CheckCircle2, Loader2, Layers, Droplets, Telescope } from "lucide-react";
import { DONATION_TIERS } from "@/lib/xendit";
import { useI18n } from "@/lib/i18n";

const tierIcons: Record<string, React.ReactNode> = {
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
    <div id="donate" className="rounded-3xl bg-white p-8 shadow-elevated ring-2 ring-bkk-100 dark:bg-slate-900 dark:ring-slate-700">
      <CheckCircle2 className="h-12 w-12 text-emerald-500" />
      <h3 className="mt-4 text-xl font-bold">Permintaan Donasi Terkirim</h3>
      <p className="mt-2 text-sm text-ink-muted">Silakan selesaikan pembayaran di halaman Xendit yang terbuka.</p>
    </div>
  );

  return (
    <div id="donate" className="relative rounded-[4rem_2.5rem_4.5rem_2rem] bg-white shadow-elevated ring-4 ring-tang-200 transition-transform hover:rotate-0 md:rotate-1 dark:bg-slate-900 dark:ring-slate-700">
      <div aria-hidden="true" className="absolute -inset-2 -z-10 -rotate-3 rounded-[4.5rem_3rem_5rem_2.5rem] bg-tang-300/50 dark:bg-slate-800" />
      <div className="px-5 pb-5 pt-5">
        <div className="mb-4 flex items-center gap-5 text-sm">
          <div>
            <p className="text-[11px] text-ink-muted">Terkumpul</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Rp 48,2 Juta</p>
          </div>
          <div className="h-8 w-px bg-ink-line" />
          <div>
            <p className="text-[11px] text-ink-muted">Donatur</p>
            <p className="text-lg font-bold text-ink">324</p>
          </div>
          <div className="h-8 w-px bg-ink-line" />
          <div>
            <p className="text-[11px] text-ink-muted">Proyek</p>
            <p className="text-lg font-bold text-ink">12</p>
          </div>
        </div>

        <h3 className="font-display text-lg font-bold text-bkk-700 dark:text-white">
          {t("donate.title")} <span className="text-bkk-500">{t("donate.titleAccent")}</span>
        </h3>
        <p className="mt-1 text-sm text-ink-muted">{t("donate.description")}</p>

        <form onSubmit={submit} className="mt-3 space-y-2">
          <select
            value={tierId}
            onChange={e => { setTierId(e.target.value); setError(""); }}
            className="w-full rounded-2xl border-2 border-tang-100 bg-white px-3 py-2 text-sm focus:border-tang-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            required
          >
            <option value="">{t("donate.chooseImpact")}</option>
            {DONATION_TIERS.map(t => (
              <option key={t.id} value={t.id}>{t.impact}</option>
            ))}
            <option value="custom">{t("donate.customOption")}</option>
          </select>

          {tier && (
            <div className="rounded-2xl bg-cream px-3 py-2 text-sm font-medium text-tang-700 dark:bg-bkk-900/30 dark:text-bkk-200">
              {tierIcons[tier.id]} <strong>{tier.impact}</strong> — {tier.label}
            </div>
          )}

          {tierId === "custom" && (
            <input
              type="number"
              value={customAmount}
              onChange={e => setCustomAmount(e.target.value)}
              className="w-full rounded-2xl border-2 border-tang-100 bg-white px-3 py-2 text-sm focus:border-tang-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
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
              className="flex-1 min-w-0 rounded-2xl border-2 border-tang-100 bg-white px-3 py-2 text-sm focus:border-tang-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
              placeholder="Nama Anda"
            />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="flex-1 min-w-0 rounded-2xl border-2 border-tang-100 bg-white px-3 py-2 text-sm focus:border-tang-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
              placeholder="Email"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name || (tierId !== "custom" && !tier) || (tierId === "custom" && !customAmount)}
            className="w-full justify-center gap-2 rounded-full bg-tang-500 py-3 font-display text-sm font-bold text-white shadow-[4px_4px_0_rgba(120,53,15,0.9)] ring-2 ring-white/60 transition hover:rotate-0 hover:bg-tang-600 -rotate-1"
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
