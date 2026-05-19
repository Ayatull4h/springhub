"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight,
  Heart,
  ShieldCheck,
  Clock,
  Sprout,
  Layers,
  Droplets,
  Telescope,
  Handshake,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { featuredProjects, PROJECT_TYPES, type ProjectTypeId } from "@/lib/data";
import { DONATION_TIERS, PAYMENT_METHODS } from "@/lib/xendit";
import { cn, formatNumber } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

const tierIcon: Record<string, typeof Sprout> = {
  seedling: Sprout,
  trench: Layers,
  sediment: Droplets,
  monitoring: Telescope,
};

const projectTypeIcon: Record<ProjectTypeId, typeof Sprout> = {
  tree_planting: Sprout,
  trench_development: Layers,
  spring_restoration: Droplets,
  monitoring_expedition: Telescope,
};

export function DonateSection() {
  const { t } = useI18n();
  const [tierId, setTierId] = useState<string>("trench");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    invoiceUrl: string;
    invoiceId: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/csrf")
      .then((r) => r.json())
      .then((data) => { if (data.token) setCsrfToken(data.token); })
      .catch(() => {});
  }, []);

  const amountIdr = customAmount
    ? parseInt(customAmount.replace(/[^0-9]/g, ""), 10) || 0
    : DONATION_TIERS.find((t) => t.id === tierId)?.amountIdr ?? 0;

  async function handleCheckout() {
    setError("");

    if (!donorName.trim()) {
      setError(t("donate.errorNameRequired"));
      return;
    }
    if (!donorEmail.trim()) {
      setError(t("donate.errorEmailRequired"));
      return;
    }
    if (amountIdr < 1000) {
      setError(t("donate.errorMinAmount"));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/donations/invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        body: JSON.stringify({
          amountIdr,
          donorName: donorName.trim(),
          donorEmail: donorEmail.trim(),
          tierId: customAmount ? "custom" : tierId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : t("donate.errorInvoiceFailed")
        );
        return;
      }

      setSuccess(data.invoice);
    } catch {
      setError(t("donate.errorNetwork"));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <section id="donate" className="container-page py-16">
        <div className="mx-auto max-w-lg text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
          <h2 className="mt-4 text-2xl font-extrabold text-ink">
            {t("donate.invoiceCreated")}
          </h2>
          <p className="mt-2 text-ink-muted">
            {t("donate.invoiceDetail", {
              id: success.invoiceId.slice(0, 12),
              amount: formatNumber(amountIdr),
            })}
          </p>
          <p className="mt-2 text-xs text-ink-muted">
            {t("donate.dummyMode")}
          </p>
          <button
            onClick={() => setSuccess(null)}
            className="btn-secondary mt-6"
          >
            {t("donate.donateAgain")}
          </button>
        </div>
      </section>
    );
  }

  const statusBadge: Record<
    string,
    { label: string; className: string; Icon: typeof ShieldCheck }
  > = {
    approved: {
      label: t("donate.statusVerified"),
      className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
      Icon: ShieldCheck,
    },
    under_review: {
      label: t("donate.statusUnderReview"),
      className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
      Icon: Clock,
    },
    rejected: {
      label: t("donate.statusRejected"),
      className: "bg-slate-100 text-slate-600",
      Icon: Clock,
    },
  };

  return (
    <section id="donate" className="container-page py-16">
      <h2 className="text-center text-3xl font-extrabold tracking-tight md:text-4xl">
        {t("donate.title")}{" "}
        <span className="text-brand-600">{t("donate.titleAccent")}</span>
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-ink-muted">
        {t("donate.description")}
      </p>

      <div className="mt-10 grid gap-4 lg:grid-cols-12">
        {/* Donation widget */}
        <div className="card lg:col-span-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Heart className="h-4 w-4 text-brand-600" />
            {t("donate.makeDonation")}
          </h3>

          {/* Payment methods strip */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PAYMENT_METHODS.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center rounded border border-ink-line bg-white px-1.5 py-0.5 text-[10px] font-medium text-ink-muted dark:border-slate-700 dark:bg-slate-800"
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {DONATION_TIERS.map((tier) => {
              const Icon = tierIcon[tier.id] ?? Heart;
              const selected = tierId === tier.id && !customAmount;
              return (
                <button
                  key={tier.id}
                  onClick={() => {
                    setTierId(tier.id);
                    setCustomAmount("");
                  }}
                  className={cn(
                    "rounded-lg border px-3 py-3 text-left transition",
                    selected
                      ? "border-brand-500 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/30"
                      : "border-ink-line hover:border-brand-300 dark:border-slate-700 dark:hover:border-brand-700"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-brand-600" />
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
                      {tier.label}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-ink-muted">{tier.impact}</div>
                </button>
              );
            })}
          </div>

          <label className="mt-4 block text-xs font-medium text-ink">
            {t("donate.customAmount")}
            <input
              type="text"
              inputMode="numeric"
              value={customAmount}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setCustomAmount(val);
                if (val) setTierId("custom");
              }}
              placeholder={t("donate.customAmountPlaceholder")}
              className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-md bg-red-50 p-2 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-3 w-3 flex-none" />
              <span>{error}</span>
            </div>
          )}

          <label className="mt-3 block text-xs font-medium text-ink">
            {t("donate.fullName")}
            <input
              type="text"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder={t("donate.fullNamePlaceholder")}
              className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>
          <label className="mt-3 block text-xs font-medium text-ink">
            {t("donate.email")}
            <input
              type="email"
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
              placeholder={t("donate.emailPlaceholder")}
              className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>

          <div className="mt-3 text-xs text-ink-muted">
            {t("donate.total")}:{" "}
            <span className="font-semibold text-ink">
              Rp {formatNumber(amountIdr)}
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="btn-primary mt-3 w-full justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("donate.processing")}
              </>
            ) : (
              <>
                {t("donate.continue")}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {/* Featured projects */}
        <div className="grid gap-4 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">
              {t("donate.featuredProjects")}
            </h3>
            <span className="text-xs text-ink-subtle">
              {t("donate.projectTypesAccepted", {
                count: String(PROJECT_TYPES.length),
              })}
            </span>
          </div>

          {featuredProjects.map((p) => {
            const pct = p.goal > 0 ? Math.round((p.raised / p.goal) * 100) : 0;
            const badge = statusBadge[p.status];
            const Icon = badge.Icon;
            const blocked = p.status !== "approved";
            const TypeIcon = projectTypeIcon[p.typeId];
            const typeMeta = PROJECT_TYPES.find((t) => t.id === p.typeId);
            return (
              <article key={p.title} className="card flex gap-4">
                <div className="aspect-square w-28 flex-none rounded-lg bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-emerald-900/30 dark:to-sky-900/30" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="chip bg-brand-50 text-brand-700">
                      <TypeIcon className="h-3 w-3" />
                      {typeMeta?.label}
                    </span>
                    <span className={`chip ${badge.className}`}>
                      <Icon className="h-3 w-3" />
                      {badge.label}
                    </span>
                  </div>
                  <h4 className="mt-1 text-sm font-semibold text-ink">
                    {p.title}
                  </h4>
                  <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
                    {p.summary}
                  </p>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-ink">
                      Rp {formatNumber(p.raised)}
                      <span className="text-ink-subtle">
                        {" "}/ Rp {formatNumber(p.goal)}
                      </span>
                    </span>
                    <span className="text-ink-muted">
                      {t("donate.supporters", { count: String(p.backers) })}
                    </span>
                  </div>
                  <button
                    disabled={blocked}
                    className={
                      blocked
                        ? "mt-3 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-ink-line bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800"
                        : "btn-secondary mt-3 w-full"
                    }
                  >
                    {blocked
                      ? t("donate.awaitingVerification")
                      : t("donate.supportProject")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Partner section */}
      <div className="mt-6 card grid gap-6 bg-gradient-to-br from-brand-50 to-white dark:from-brand-900/30 dark:to-slate-900 md:grid-cols-3 md:items-center">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Handshake className="h-4 w-4 text-brand-600" />
            {t("donate.becomePartner")}
          </div>
          <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-brand-700">
            {t("donate.partnerTitle")}
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            {t("donate.partnerDesc")}
          </p>
          <ul className="mt-4 grid gap-2 text-xs text-ink-muted sm:grid-cols-2">
            {PROJECT_TYPES.map((t) => {
              const Icon = projectTypeIcon[t.id];
              return (
                <li key={t.id} className="flex items-start gap-2">
                  <Icon className="mt-0.5 h-3.5 w-3.5 flex-none text-brand-600" />
                  <span>
                    <span className="font-semibold text-ink">{t.label}</span> ·{" "}
                    {t.summary}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex flex-col items-stretch gap-2">
          <button className="btn-primary justify-center">
            {t("donate.becomePartnerCta")}
            <ArrowRight className="h-4 w-4" />
          </button>
          <button className="btn-secondary justify-center">
            {t("donate.downloadDeck")}
          </button>
        </div>
      </div>
    </section>
  );
}
