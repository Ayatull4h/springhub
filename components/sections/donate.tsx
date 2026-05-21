"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import {
  Heart,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sprout,
  Layers,
  Droplets,
  Telescope,
  Handshake,
  ArrowRight,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { featuredProjects, PROJECT_TYPES, type ProjectTypeId } from "@/lib/data";
import { formatNumber } from "@/lib/utils";

const projectTypeIcon: Record<ProjectTypeId, typeof Sprout> = {
  tree_planting: Sprout,
  trench_development: Layers,
  spring_restoration: Droplets,
  monitoring_expedition: Telescope,
};

export function DonateSection() {
  const { t } = useI18n();
  const [donationType, setDonationType] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [treeCount, setTreeCount] = useState(1);
  const [treeSpecies, setTreeSpecies] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [projPage, setProjPage] = useState(1);
  const projPerPage = 1;
  const projTotal = featuredProjects.length;
  const currentProj = featuredProjects[projPage - 1];

  async function handleMoneyDonation() {
    const amount = parseInt(customAmount);
    if (!amount || amount < 1000) { setError("Minimal donasi Rp 1.000"); return; }
    if (!donorName.trim()) { setError("Nama wajib diisi"); return; }
    setLoading(true);
    try {
      const csrf = await fetch("/api/csrf").then(r => r.json());
      const res = await fetch("/api/donations/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf.token },
        body: JSON.stringify({ amountIdr: amount, donorName, donorEmail, tierId: "custom" }),
      });
      const data = await res.json();
      if (res.ok && data.invoiceUrl) {
        window.location.href = data.invoiceUrl;
      } else {
        setError(data.error || "Gagal memproses donasi");
      }
    } catch { setError("Kesalahan jaringan"); }
    finally { setLoading(false); }
  }

  async function handleTreeDonation() {
    if (!donorName.trim()) { setError("Nama wajib diisi"); return; }
    if (treeCount < 1) { setError("Minimal 1 bibit"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/donations/tree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorName, donorEmail, donorPhone, treeCount, treeSpecies }),
      });
      const data = await res.json();
      if (res.ok) { setSuccess(true); }
      else { setError(data.error || "Gagal mengirim"); }
    } catch { setError("Kesalahan jaringan"); }
    finally { setLoading(false); }
  }

  const statusBadge: Record<string, { label: string; className: string; Icon: typeof ShieldCheck }> = {
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

  if (success) {
    return (
      <section className="container-page py-16">
        <div className="mx-auto max-w-md text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <h2 className="mt-4 text-xl font-bold text-ink">Permintaan Terkirim!</h2>
          <p className="mt-2 text-ink-muted">Admin akan menghubungi Anda melalui email/WA setelah diverifikasi.</p>
          <button onClick={() => { setSuccess(false); setDonationType(""); }} className="btn-primary mt-6">Donasi Lagi</button>
        </div>
      </section>
    );
  }

  return (
    <section id="donate" className="container-page py-16">
      <h2 className="text-center text-3xl font-extrabold tracking-tight md:text-4xl">
        {t("donate.title")}{" "}
        <span className="text-brand-600">{t("donate.titleAccent")}</span>
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-ink-muted">{t("donate.description")}</p>

      <div className="mt-8 grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5 space-y-4">
          <div className="card space-y-4">
            <label className="text-sm font-semibold text-ink">Saya ingin:</label>
            <select value={donationType} onChange={e => setDonationType(e.target.value)} className="w-full rounded-md border border-ink-line px-3 py-2.5 text-sm">
              <option value="">-- Pilih jenis donasi --</option>
              <option value="money">💰 Donasi Uang</option>
              <option value="tree">🌱 Donasi Bibit Pohon</option>
            </select>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}

          {donationType === "money" && (
            <div className="card space-y-4">
              <label className="text-sm font-semibold text-ink">💰 Donasi Uang</label>
              <div>
                <label className="text-xs font-medium text-ink-muted">Jumlah (Rp)</label>
                <input type="number" value={customAmount} onChange={e => setCustomAmount(e.target.value)} placeholder="50000" min={1000} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Nama <span className="text-red-500">*</span></label>
                <input type="text" value={donorName} onChange={e => setDonorName(e.target.value)} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Email</label>
                <input type="email" value={donorEmail} onChange={e => setDonorEmail(e.target.value)} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm" />
              </div>
              <button onClick={handleMoneyDonation} disabled={loading} className="btn-primary w-full justify-center">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `💳 Donasi Rp ${parseInt(customAmount || "0").toLocaleString("id-ID")}`}
              </button>
              <p className="text-center text-[11px] text-ink-subtle">Bayar via: OVO GoPay DANA ShopeePay QRIS Kartu Virtual Account</p>
            </div>
          )}

          {donationType === "tree" && (
            <div className="card space-y-4">
              <label className="text-sm font-semibold text-ink">🌱 Donasi Bibit Pohon</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-ink-muted">Jumlah Bibit <span className="text-red-500">*</span></label>
                  <input type="number" value={treeCount} onChange={e => setTreeCount(parseInt(e.target.value) || 0)} min={1} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-muted">Jenis Pohon</label>
                  <input type="text" value={treeSpecies} onChange={e => setTreeSpecies(e.target.value)} placeholder="Mahoni, Bambu..." className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Nama <span className="text-red-500">*</span></label>
                <input type="text" value={donorName} onChange={e => setDonorName(e.target.value)} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Email / No HP</label>
                <input type="text" value={donorEmail} onChange={e => setDonorEmail(e.target.value)} placeholder="Email atau nomor WA" className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm" />
              </div>
              <button onClick={handleTreeDonation} disabled={loading} className="btn-primary w-full justify-center">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "📩 Kirim Permintaan"}
              </button>
              <p className="text-center text-[11px] text-ink-subtle">Admin akan menghubungi Anda setelah diverifikasi.</p>
            </div>
          )}

          {!donationType && (
            <div className="card text-center py-8 text-ink-muted">
              <Heart className="mx-auto h-8 w-8 text-brand-600" />
              <p className="mt-2 text-sm">Pilih jenis donasi di atas untuk memulai.</p>
            </div>
          )}

          <div className="card grid gap-6 bg-gradient-to-br from-brand-50 to-white dark:from-brand-900/30 dark:to-slate-900 md:grid-cols-3 md:items-center">
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
              <a href="mailto:info@jagasemesta.id" className="btn-primary justify-center">
                {t("donate.becomePartnerCta")}
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href="/help" className="btn-secondary justify-center">
                {t("donate.downloadDeck")}
              </a>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 grid gap-4">
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

          {currentProj && (
            <div key={currentProj.title} className="card">
              {(() => {
                const p = currentProj;
                const pct = p.goal > 0 ? Math.round((p.raised / p.goal) * 100) : 0;
                const badge = statusBadge[p.status];
                const Icon = badge.Icon;
                const blocked = p.status !== "approved";
                const TypeIcon = projectTypeIcon[p.typeId];
                const typeMeta = PROJECT_TYPES.find((t) => t.id === p.typeId);
                return (
                  <div className="flex gap-4">
                    <div className="flex aspect-square w-28 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-emerald-900/30 dark:to-sky-900/30">
                      <TypeIcon className="h-10 w-10 text-brand-600/60" />
                    </div>
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
                  </div>
                );
              })()}
            </div>
          )}

          {projTotal > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setProjPage(p => Math.max(1, p - 1))} disabled={projPage === 1} className="text-xs text-ink-muted disabled:opacity-30">←</button>
              <span className="text-xs text-ink-muted">{projPage} / {projTotal}</span>
              <button onClick={() => setProjPage(p => Math.min(projTotal, p + 1))} disabled={projPage >= projTotal} className="text-xs text-ink-muted disabled:opacity-30">→</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
