"use client";

import { useState } from "react";
import { Heart, ArrowRight, CheckCircle2, Loader2, Sprout, Layers, Droplets, Telescope } from "lucide-react";
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
      <div className="mx-auto max-w-md text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h3 className="mt-4 text-xl font-bold">Permintaan Donasi Terkirim</h3>
        <p className="mt-2 text-sm text-ink-muted">Silakan selesaikan pembayaran di halaman Xendit yang terbuka.</p>
      </div>
    </div>
  );

  return (
    <div id="donate">
      <div className="mx-auto max-w-lg">
        <h2 className="text-center text-3xl font-extrabold md:text-4xl">
          {t("donate.title")} <span className="text-brand-600">{t("donate.titleAccent")}</span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-ink-muted">
          {t("donate.description")}
        </p>

        <form onSubmit={submit} className="card mt-8 space-y-5">
          {/* Impact dropdown */}
          <div>
            <label className="text-sm font-semibold text-ink">{t("donate.selectImpact")}</label>
            <select
              value={tierId}
              onChange={e => { setTierId(e.target.value); setError(""); }}
              className="mt-1.5 w-full rounded-lg border border-ink-line bg-white px-4 py-3 text-sm transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:bg-slate-800"
              required
            >
              <option value="">— {t("donate.chooseImpact")} —</option>
              {DONATION_TIERS.map(t => (
                <option key={t.id} value={t.id}>
                  {t.impact} — {t.label}
                </option>
              ))}
              <option value="custom">{t("donate.customOption")}</option>
            </select>
          </div>

          {/* Selected impact summary */}
          {tier && (
            <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800 dark:bg-brand-900/30 dark:text-brand-300">
              {tierIcons[tier.id]} {t("donate.supporting")} <strong>{tier.impact}</strong>
              <br />
              {t("donate.forAmount")} <strong>{tier.label}</strong>
            </div>
          )}

          {/* Custom amount input */}
          {tierId === "custom" && (
            <div>
              <label className="text-xs font-medium text-ink-muted">{t("donate.customAmount")}</label>
              <input
                type="number"
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink-line px-4 py-2.5 text-sm dark:bg-slate-800"
                placeholder={t("donate.customAmountPlaceholder")}
                min={1000}
                required
              />
            </div>
          )}

          {/* Name + Email */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-ink-muted">{t("donate.fullName")} *</label>
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink-line px-4 py-2.5 text-sm transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:bg-slate-800"
                placeholder={t("donate.fullNamePlaceholder")}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted">{t("donate.email")}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink-line px-4 py-2.5 text-sm transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:bg-slate-800"
                placeholder={t("donate.emailPlaceholder")}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !name || (tierId !== "custom" && !tier) || (tierId === "custom" && !customAmount)}
            className="btn-primary w-full justify-center gap-2 py-3 text-base"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <><Heart className="h-5 w-5" /> {effectiveAmount > 0 ? `Rp ${effectiveAmount.toLocaleString("id-ID")}` : t("donate.continue")}</>
            )}
          </button>

          <p className="text-center text-xs text-ink-subtle">
            {t("donate.paymentMethods")}
          </p>
        </form>
      </div>
    </div>
  );
}
