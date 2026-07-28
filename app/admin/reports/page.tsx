"use client";

import { useEffect, useState, useMemo } from "react";
import { MapPin, CheckCircle2, Clock, XCircle, Eye, EyeOff, Download, ToggleLeft, ToggleRight, FlaskConical } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type ReportItem = {
  id: string;
  formSlug: string;
  status: string;
  isActive: boolean;
  isDummy: boolean;
  fieldData: string;
  userId: string | null;
  guestId: string | null;
  preciseLat: number | null;
  preciseLng: number | null;
  snappedLat: number | null;
  snappedLng: number | null;
  createdAt: string;
  submitter: { type: string; id: string | null; name: string | null; email: string | null } | null;
  reviewedBy: { username: string } | null;
  photos?: { id: string; storagePath: string }[];
  _count?: { photos: number };
};

export default function AdminReportsPage() {
  const { t } = useI18n();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrecise, setShowPrecise] = useState(false);
  const [showDummy, setShowDummy] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [approvingAll, setApprovingAll] = useState(false);

  // Photo URL builder
  function photoUrl(storagePath: string): string {
    if (!storagePath || storagePath.startsWith("http")) return storagePath || "";
    // For seed data with label-only paths, return empty
    if (!storagePath.includes("/") || storagePath.includes("placehold")) return "";
    return `/uploads/${storagePath}`;
  }

  async function fetchReports() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("per_page", String(perPage));
      const res = await fetch(`/api/admin/reports?${params}`);
      const data = await res.json();
      setReports(data.reports ?? []);
      setTotal(data.pagination?.total ?? 0);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchReports(); }, [page, perPage]);

  const filteredReports = useMemo(() => {
    let result = reports;
    if (!showDummy) {
      result = result.filter(r => !r.isDummy);
    }
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
  }, [reports, dateFrom, dateTo, showDummy]);

  const [toggling, setToggling] = useState<string | null>(null);

  async function toggleActive(id: string) {
    setToggling(id);
    try {
      const { token: csrfToken } = await fetch("/api/csrf").then(r => r.json());
      const res = await fetch(`/api/admin/reports/${id}/toggle`, { method: "POST", headers: { "x-csrf-token": csrfToken } });
      if (res.ok) {
        const data = await res.json();
        setReports(prev => prev.map(r => r.id === id ? { ...r, isActive: data.isActive } : r));
      }
    } catch {}
    setToggling(null);
  }

  async function approveAll() {
    if (!confirm("Approve semua laporan pending? Tindakan ini tidak bisa dibatalkan.")) return;
    setApprovingAll(true);
    try {
      const csrfRes = await fetch("/api/csrf");
      const { token } = await csrfRes.json();
      const res = await fetch("/api/admin/reports/approve-all", {
        method: "POST",
        headers: { "x-csrf-token": token },
      });
      const data = await res.json();
      if (data.success) {
        alert(`${data.approved} laporan di-approve!`);
        fetchReports();
      }
    } catch (e) {
      console.error(e);
      alert("Gagal approve all");
    } finally {
      setApprovingAll(false);
    }
  }

  const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
    approved: { label: t("admin.status.approved"), icon: CheckCircle2, className: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300" },
    pending: { label: t("admin.status.pending"), icon: Clock, className: "text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300" },
    rejected: { label: t("admin.status.rejected"), icon: XCircle, className: "text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300" },
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
            {total} total · {reports.filter(r => r.isDummy).length} demo · Halaman {page}/{totalPages}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full min-w-0 rounded-md border border-ink-line px-2 py-1.5 text-xs sm:w-auto dark:bg-slate-800 dark:text-white" />
            <span className="hidden text-xs text-ink-muted sm:inline">s/d</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full min-w-0 rounded-md border border-ink-line px-2 py-1.5 text-xs sm:w-auto dark:bg-slate-800 dark:text-white" />
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="whitespace-nowrap text-xs text-brand-600 hover:underline">Reset</button>
            )}
          </div>
          <select
            value={perPage}
            onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
            className="rounded-md border border-ink-line px-2 py-1.5 text-xs dark:bg-slate-800 dark:text-white"
          >
            <option value={25}>25/page</option>
            <option value={50}>50/page</option>
            <option value={100}>100/page</option>
            <option value={200}>200/page</option>
          </select>
          <button
            onClick={approveAll}
            disabled={approvingAll}
            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {approvingAll ? "⏳" : "✅"} Approve All
          </button>
          <button
            onClick={() => window.open("/api/admin/export?entity=reports&format=csv", "_blank")}
            className="inline-flex items-center gap-1 rounded-md border border-ink-line px-3 py-1.5 text-sm text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={() => setShowDummy(!showDummy)}
            className={`inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${
              showDummy ? "border-purple-400 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" : "border-ink-line text-ink-muted"
            }`}
          >
            <FlaskConical className="h-4 w-4" />
            Demo
          </button>
          <button
            onClick={() => setShowPrecise(!showPrecise)}
            className="inline-flex items-center gap-1 rounded-md border border-ink-line px-3 py-1.5 text-sm text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {showPrecise ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPrecise ? t("admin.reports.hideCoords") : t("admin.reports.showCoords")}
          </button>
        </div>
      </div>

      {/* Mobile card view */}
      <div className="grid gap-3 md:hidden">
        {filteredReports.map((r) => {
          const status = statusConfig[r.status] ?? statusConfig.pending;
          const StatusIcon = status.icon;
          return (
            <div key={r.id} className="card space-y-2">
              <div className="flex items-start justify-between">
                <span className="chip bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 text-xs">
                  {formLabels[r.formSlug] ?? r.formSlug}
                </span>
                {r.isDummy && (
                  <span className="chip bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-[10px]">
                    Demo
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </span>
              </div>
              <div className="text-xs text-ink-muted">
                {r.submitter?.name ?? `${t("common.guest")} (${r.guestId?.slice(0, 8)}...)`} · {new Date(r.createdAt).toLocaleDateString("id-ID")}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  onClick={() => toggleActive(r.id)}
                  disabled={toggling === r.id}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition ${
                    r.isActive
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {r.isActive ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                  {r.isActive ? "Active" : "Inactive"}
                </button>
                <span className="text-ink-subtle">
                  {showPrecise
                    ? `${r.preciseLat?.toFixed(4) ?? "—"}, ${r.preciseLng?.toFixed(4) ?? "—"}`
                    : "••••••"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-[900px]">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-ink-line text-xs font-medium text-ink-subtle">
              <th className="pb-3 pr-2">Foto</th>
              <th className="pb-3 pr-3">{t("reports.form")}</th>
              <th className="pb-3 pr-3">User</th>
              <th className="pb-3 pr-3">Status</th>
              <th className="pb-3 pr-3">Foto</th>
              <th className="pb-3 pr-3">Active</th>
              <th className="pb-3 pr-3">{t("admin.reports.precise")}</th>
              <th className="pb-3 pr-3">Precise Lng</th>
              <th className="pb-3 pr-3">Reviewed</th>
              <th className="pb-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((r) => {
              const status = statusConfig[r.status] ?? statusConfig.pending;
              const StatusIcon = status.icon;
              const firstPhoto = (r as any).photos?.[0];
              const photoUrl_str = firstPhoto?.storagePath
                ? (firstPhoto.storagePath.startsWith("http") ? firstPhoto.storagePath : `/uploads/${firstPhoto.storagePath}`)
                : "";
              return (
                <tr key={r.id} className="border-b border-ink-line last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="py-3 pr-2">
                    {photoUrl_str ? (
                      <img src={photoUrl_str} alt="" className="h-8 w-8 rounded object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-[10px] text-ink-subtle dark:bg-slate-700">—</div>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-ink">
                    <span>{formLabels[r.formSlug] ?? r.formSlug}</span>
                    {r.isDummy && (
                      <span className="ml-1.5 chip bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-[10px]">Demo</span>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-ink-muted">{r.submitter?.name ?? `${t("common.guest")} (${r.guestId?.slice(0, 8)}...)`}</td>
                  <td className="py-3 pr-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-xs text-ink-muted">{(r as any)._count?.photos ?? "—"}</td>
                  <td className="py-3 pr-3">
                    <button
                      onClick={() => toggleActive(r.id)}
                      disabled={toggling === r.id}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition ${r.isActive ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}
                    >
                      {r.isActive ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                      {r.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="py-3 pr-3 font-mono text-xs text-ink-muted">{showPrecise ? r.preciseLat ?? "—" : "••••••"}</td>
                  <td className="py-3 pr-3 font-mono text-xs text-ink-muted">{showPrecise ? r.preciseLng ?? "—" : "••••••"}</td>
                  <td className="py-3 pr-3 text-ink-muted">{r.reviewedBy?.username ?? "—"}</td>
                  <td className="py-3 text-xs text-ink-muted">{new Date(r.createdAt).toLocaleDateString("id-ID")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-ink-line px-3 py-1 text-sm disabled:opacity-40"
          >
            ← Prev
          </button>
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 10) {
              pageNum = i + 1;
            } else if (page <= 5) {
              pageNum = i + 1;
            } else if (page >= totalPages - 4) {
              pageNum = totalPages - 9 + i;
            } else {
              pageNum = page - 5 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`rounded-md px-3 py-1 text-sm ${pageNum === page ? "bg-brand-600 text-white" : "border border-ink-line hover:bg-slate-100 dark:hover:bg-slate-700"}`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-md border border-ink-line px-3 py-1 text-sm disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
