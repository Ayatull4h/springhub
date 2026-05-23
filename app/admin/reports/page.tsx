"use client";

import { useEffect, useState, useMemo } from "react";
import { MapPin, CheckCircle2, Clock, XCircle, Eye, EyeOff, Download } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type ReportItem = {
  id: string;
  formSlug: string;
  status: string;
  fieldData: string;
  userId: string | null;
  guestId: string | null;
  preciseLat: number | null;
  preciseLng: number | null;
  snappedLat: number | null;
  snappedLng: number | null;
  createdAt: string;
  user: { username: string; email: string } | null;
  reviewedBy: { username: string } | null;
};

export default function AdminReportsPage() {
  const { t } = useI18n();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrecise, setShowPrecise] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredReports = useMemo(() => {
    let result = reports;
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter(r => new Date(r.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59);
      result = result.filter(r => new Date(r.createdAt) <= to);
    }
    return result;
  }, [reports, dateFrom, dateTo]);

  useEffect(() => {
    fetch("/api/admin/reports")
      .then((r) => r.json())
      .then((data) => setReports(data.reports ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
    approved: { label: t("admin.status.approved"), icon: CheckCircle2, className: "text-emerald-600 bg-emerald-50" },
    pending: { label: t("admin.status.pending"), icon: Clock, className: "text-amber-600 bg-amber-50" },
    rejected: { label: t("admin.status.rejected"), icon: XCircle, className: "text-red-600 bg-red-50" },
  };

  const formLabels: Record<string, string> = {
    "spring-monitoring": t("profile.form.springMonitoring"),
    "spring-restoration": t("profile.form.springRestoration"),
    "trench-development": t("profile.form.trenchDevelopment"),
    "tree-planting": t("profile.form.treePlanting"),
    "seedling-stock": t("profile.form.seedlingStock"),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">{t("admin.reports.title")}</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {t("admin.reports.count", { count: String(reports.length) })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full min-w-0 rounded-md border border-ink-line px-2 py-1.5 text-xs sm:w-auto" />
            <span className="hidden text-xs text-ink-muted sm:inline">s/d</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full min-w-0 rounded-md border border-ink-line px-2 py-1.5 text-xs sm:w-auto" />
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="whitespace-nowrap text-xs text-brand-600 hover:underline">Reset</button>
            )}
          </div>
          <button
            onClick={() => window.open("/api/admin/export?entity=reports&format=csv", "_blank")}
            className="inline-flex items-center gap-1 rounded-md border border-ink-line px-3 py-1.5 text-sm text-ink-muted hover:bg-slate-100"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={() => setShowPrecise(!showPrecise)}
            className="inline-flex items-center gap-1 rounded-md border border-ink-line px-3 py-1.5 text-sm text-ink-muted hover:bg-slate-100"
          >
            {showPrecise ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPrecise ? t("admin.reports.hideCoords") : t("admin.reports.showCoords")}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-ink-line text-xs font-medium text-ink-subtle">
              <th className="pb-3 pr-3">{t("reports.form")}</th>
              <th className="pb-3 pr-3">User</th>
              <th className="pb-3 pr-3">{t("admin.users.role")}</th>
              <th className="pb-3 pr-3">{t("admin.reports.precise")}</th>
              <th className="pb-3 pr-3">Precise Lng</th>
              <th className="pb-3 pr-3">Snapped</th>
              <th className="pb-3 pr-3">Reviewed</th>
              <th className="pb-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((r) => {
              const status = statusConfig[r.status] ?? statusConfig.pending;
              const StatusIcon = status.icon;
              return (
                <tr key={r.id} className="border-b border-ink-line last:border-0 hover:bg-slate-50">
                  <td className="py-3 pr-3 text-ink">
                    {formLabels[r.formSlug] ?? r.formSlug}
                  </td>
                  <td className="py-3 pr-3 text-ink-muted">
                    {r.user?.username ?? `${t("common.guest")} (${r.guestId?.slice(0, 8)}...)`}
                  </td>
                  <td className="py-3 pr-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </span>
                  </td>
                  <td className="py-3 pr-3 font-mono text-xs text-ink-muted">
                    {showPrecise ? r.preciseLat ?? "—" : "••••••"}
                  </td>
                  <td className="py-3 pr-3 font-mono text-xs text-ink-muted">
                    {showPrecise ? r.preciseLng ?? "—" : "••••••"}
                  </td>
                  <td className="py-3 pr-3 font-mono text-xs text-ink-muted">
                    {r.snappedLat?.toFixed(3) ?? "—"}, {r.snappedLng?.toFixed(3) ?? "—"}
                  </td>
                  <td className="py-3 pr-3 text-ink-muted">
                    {r.reviewedBy?.username ?? "—"}
                  </td>
                  <td className="py-3 text-xs text-ink-muted">
                    {new Date(r.createdAt).toLocaleDateString("id-ID")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
