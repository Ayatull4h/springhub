"use client";

import { useEffect, useState } from "react";
import { Heart, CheckCircle2, Clock, XCircle, AlertTriangle, Download } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type DonationItem = {
  id: string;
  amountIdr: number;
  donorName: string;
  donorEmail: string;
  status: string;
  tierId: string;
  invoiceId: string;
  createdAt: string;
  paidAt: string | null;
  user: { username: string; email: string } | null;
  project: { title: string } | null;
};

export default function AdminDonationsPage() {
  const { t } = useI18n();
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/donations")
      .then((r) => r.json())
      .then((data) => setDonations(data.donations ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
    paid: { label: t("admin.status.paid"), icon: CheckCircle2, className: "text-emerald-600 bg-emerald-50" },
    pending: { label: t("admin.status.pending"), icon: Clock, className: "text-amber-600 bg-amber-50" },
    expired: { label: t("admin.status.expired"), icon: XCircle, className: "text-red-600 bg-red-50" },
    failed: { label: t("admin.status.failed"), icon: AlertTriangle, className: "text-red-600 bg-red-50" },
  };

  const totalAmount = donations
    .filter((d) => d.status === "paid")
    .reduce((sum, d) => sum + d.amountIdr, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">{t("admin.donations.title")}</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {t("admin.donations.count", { count: String(donations.length) })} ·{" "}
            <span className="font-medium text-brand-600">
              Rp {totalAmount.toLocaleString("id-ID")} {t("admin.donations.collected")}
            </span>
          </p>
        </div>
        <button
          onClick={() => window.open("/api/admin/export?entity=donations&format=csv", "_blank")}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-md border border-ink-line px-3 py-2 text-sm font-medium text-ink-muted hover:bg-slate-100 hover:text-ink"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-ink-line text-xs font-medium text-ink-subtle">
              <th className="pb-3 pr-3">Invoice</th>
              <th className="pb-3 pr-3">Donor</th>
              <th className="pb-3 pr-3">{t("donate.email")}</th>
              <th className="pb-3 pr-3">Amount</th>
              <th className="pb-3 pr-3">Status</th>
              <th className="pb-3 pr-3">Tier</th>
              <th className="pb-3 pr-3">Project</th>
              <th className="pb-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {donations.map((d) => {
              const status = statusConfig[d.status] ?? statusConfig.pending;
              const StatusIcon = status.icon;
              return (
                <tr key={d.id} className="border-b border-ink-line last:border-0 hover:bg-slate-50">
                  <td className="py-3 pr-3 font-mono text-xs text-ink-muted">
                    {d.invoiceId ? d.invoiceId.slice(0, 12) + "..." : "—"}
                  </td>
                  <td className="py-3 pr-3 font-medium text-ink">{d.donorName || d.user?.username || "—"}</td>
                  <td className="py-3 pr-3 text-ink-muted">{d.donorEmail || d.user?.email || "—"}</td>
                  <td className="py-3 pr-3 font-medium text-ink">
                    Rp {d.amountIdr.toLocaleString("id-ID")}
                  </td>
                  <td className="py-3 pr-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-xs text-ink-muted">{d.tierId || "—"}</td>
                  <td className="py-3 pr-3 text-xs text-ink-muted">{d.project?.title || "—"}</td>
                  <td className="py-3 text-xs text-ink-muted">
                    {new Date(d.createdAt).toLocaleDateString("id-ID")}
                  </td>
                </tr>
              );
            })}
            {donations.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-sm text-ink-muted">
                  {t("admin.donations.noData")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
