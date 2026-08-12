"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Link2, Sprout, CheckCircle2, Clock, XCircle, Search, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type OrphanReport = {
  id: string;
  formSlug: string;
  status: string;
  isActive: boolean;
  isDummy: boolean;
  fieldData: string;
  preciseLat: number | null;
  preciseLng: number | null;
  snappedLat: number | null;
  snappedLng: number | null;
  createdAt: string;
  formTitle: string | null;
  photoCount: number;
  submitter: { type: string; id: string | null; name: string | null; email: string | null } | null;
};

type SpringCandidate = {
  id: string;
  name: string;
  province: string;
  regency: string;
  status: string;
  _count: { reports: number };
};

export default function AdminOrphansPage() {
  const { t } = useI18n();
  const [reports, setReports] = useState<OrphanReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState("");

  const [springQuery, setSpringQuery] = useState("");
  const [springResults, setSpringResults] = useState<SpringCandidate[]>([]);
  const [springSearching, setSpringSearching] = useState(false);
  const [chosenSpring, setChosenSpring] = useState<SpringCandidate | null>(null);
  const [linking, setLinking] = useState(false);

  const [createName, setCreateName] = useState("");
  const [createProvince, setCreateProvince] = useState("");
  const [createRegency, setCreateRegency] = useState("");
  const [creating, setCreating] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function reportSpringName(r: OrphanReport): string {
    try {
      const fd = JSON.parse(r.fieldData || "{}");
      return (fd?.spring_name || fd?.B1_nama || fd?.A_kegiatan || "").trim();
    } catch {
      return "";
    }
  }

  async function fetchOrphans() {
    setLoading(true);
    setActionError("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("per_page", String(perPage));
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/reports/orphans?${params}`);
      const data = await res.json();
      setReports(data.reports ?? []);
      setTotal(data.pagination?.total ?? 0);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch {
      setActionError(t("admin.orphans.loadFailed"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrphans();
  }, [page, perPage, statusFilter]);

  useEffect(() => {
    setSelected(new Set());
  }, [page, statusFilter, reports]);

  const selectedReports = useMemo(() => reports.filter((r) => selected.has(r.id)), [reports, selected]);

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(reports.map((r) => r.id)) : new Set());
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function searchSprings(q: string) {
    setSpringQuery(q);
    setChosenSpring(null);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.trim().length < 2) {
      setSpringResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSpringSearching(true);
      try {
        const res = await fetch(`/api/springs/search?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setSpringResults(data.springs ?? []);
      } catch {
        setSpringResults([]);
      } finally {
        setSpringSearching(false);
      }
    }, 300);
  }

  async function linkToSpring() {
    if (!chosenSpring || selectedReports.length === 0) {
      setActionError(t("admin.orphans.linkIncomplete"));
      return;
    }
    if (!confirm(`${t("admin.orphans.confirmLink")} ${selectedReports.length} → ${chosenSpring.name}?`)) return;
    setLinking(true);
    setActionError("");
    try {
      const csrfRes = await fetch("/api/csrf");
      const { token } = await csrfRes.json();
      const res = await fetch("/api/admin/reports/orphans/link", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ reportIds: Array.from(selected), springId: chosenSpring.id }),
      });
      const data = await res.json();
      if (data.success) {
        alert(t("admin.orphans.linkSuccess", { count: String(data.count), name: chosenSpring.name }));
        setSpringQuery("");
        setSpringResults([]);
        setChosenSpring(null);
        setSelected(new Set());
        fetchOrphans();
      } else {
        setActionError(data.error || t("admin.orphans.linkFailed"));
      }
    } catch {
      setActionError(t("admin.orphans.linkFailed"));
    } finally {
      setLinking(false);
    }
  }

  async function createSpringFromReports() {
    if (selectedReports.length === 0) {
      setActionError(t("admin.orphans.noSelection"));
      return;
    }
    const autoName = reportSpringName(selectedReports[0]);
    const finalName = createName.trim() || autoName;
    if (!confirm(`${t("admin.orphans.confirmCreate")} "${finalName}" (${selectedReports.length} laporan)?`)) return;
    setCreating(true);
    setActionError("");
    try {
      const csrfRes = await fetch("/api/csrf");
      const { token } = await csrfRes.json();
      const res = await fetch("/api/admin/reports/orphans/create-spring", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({
          reportIds: Array.from(selected),
          name: finalName,
          province: createProvince.trim(),
          regency: createRegency.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`${t("admin.orphans.createSuccess")} "${data.springName}" (${data.count} laporan)`);
        setCreateName("");
        setCreateProvince("");
        setCreateRegency("");
        setSelected(new Set());
        fetchOrphans();
      } else {
        setActionError(data.error || t("admin.orphans.createFailed"));
      }
    } catch {
      setActionError(t("admin.orphans.createFailed"));
    } finally {
      setCreating(false);
    }
  }

  if (loading && reports.length === 0) {
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
          <h2 className="text-xl font-bold text-ink">{t("admin.orphans.title")}</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {t("admin.orphans.description")} · {total} total · Halaman {page}/{totalPages}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-ink-line px-2 py-1.5 text-xs dark:bg-slate-800 dark:text-white"
          >
            <option value="all">{t("admin.orphans.statusAll")}</option>
            <option value="pending">{t("admin.status.pending")}</option>
            <option value="approved">{t("admin.status.approved")}</option>
            <option value="rejected">{t("admin.status.rejected")}</option>
          </select>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-md border border-ink-line px-2 py-1.5 text-xs dark:bg-slate-800 dark:text-white"
          >
            <option value={25}>25/page</option>
            <option value={50}>50/page</option>
            <option value={100}>100/page</option>
            <option value={200}>200/page</option>
          </select>
        </div>
      </div>

      {actionError && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {actionError}
        </div>
      )}

      {/* Action panel */}
      <div className="card space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold text-ink">{t("admin.orphans.selected", { count: String(selectedReports.length) })}</span>
          {selectedReports.length > 0 && (
            <button onClick={() => setSelected(new Set())} className="text-xs text-brand-600 hover:underline">
              {t("admin.orphans.clearSelection")}
            </button>
          )}
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-ink-line/60 p-3 dark:border-slate-700">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Link2 className="h-4 w-4 text-brand-600" />
              {t("admin.orphans.linkToSpring")}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-ink-subtle" />
                <input
                  type="text"
                  value={springQuery}
                  onChange={(e) => searchSprings(e.target.value)}
                  placeholder={t("admin.orphans.springSearchPlaceholder")}
                  className="w-full rounded-md border border-ink-line py-2 pl-9 pr-3 text-sm dark:bg-slate-800 dark:text-white"
                />
                {springSearching && (
                  <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-ink-subtle" />
                )}
                {springResults.length > 0 && !chosenSpring && (
                  <ul className="absolute z-10 mt-1 max-h-52 w-full overflow-auto rounded-md border border-ink-line bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    {springResults.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setChosenSpring(s);
                            setSpringQuery(s.name);
                            setSpringResults([]);
                          }}
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                          <span className="font-medium text-ink dark:text-white">{s.name}</span>
                          <span className="ml-2 text-xs text-ink-muted">
                            {[s.province, s.regency].filter(Boolean).join(", ")} · {s._count.reports} laporan
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                onClick={linkToSpring}
                disabled={linking || !chosenSpring || selectedReports.length === 0}
                className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {linking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                {t("admin.orphans.linkButton")}
              </button>
            </div>
            {chosenSpring && (
              <div className="mt-2 text-xs text-ink-muted">
                {t("admin.orphans.chosenSpring")}: <span className="font-medium text-ink dark:text-white">{chosenSpring.name}</span>
                <button onClick={() => { setChosenSpring(null); setSpringQuery(""); }} className="ml-2 text-brand-600 hover:underline">
                  {t("common.cancel")}
                </button>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-ink-line/60 p-3 dark:border-slate-700">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Sprout className="h-4 w-4 text-emerald-600" />
              {t("admin.orphans.createSpring")}
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder={t("admin.orphans.createNamePlaceholder")}
                className="w-full rounded-md border border-ink-line px-3 py-2 text-sm sm:col-span-3 dark:bg-slate-800 dark:text-white"
              />
              <input
                type="text"
                value={createProvince}
                onChange={(e) => setCreateProvince(e.target.value)}
                placeholder={t("admin.orphans.createProvince")}
                className="w-full rounded-md border border-ink-line px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
              />
              <input
                type="text"
                value={createRegency}
                onChange={(e) => setCreateRegency(e.target.value)}
                placeholder={t("admin.orphans.createRegency")}
                className="w-full rounded-md border border-ink-line px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
              />
              <button
                onClick={createSpringFromReports}
                disabled={creating || selectedReports.length === 0}
                className="inline-flex items-center justify-center gap-1 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sprout className="h-4 w-4" />}
                {t("admin.orphans.createButton")}
              </button>
            </div>
            {selectedReports.length > 0 && !createName && reportSpringName(selectedReports[0]) && (
              <div className="mt-2 text-xs text-ink-muted">
                {t("admin.orphans.autoName")}: <span className="font-medium text-ink dark:text-white">{reportSpringName(selectedReports[0])}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="card overflow-x-auto">
        <div className="min-w-[900px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-ink-line text-xs font-medium text-ink-subtle">
                <th className="pb-3 pr-2">
                  <input
                    type="checkbox"
                    checked={reports.length > 0 && selectedReports.length === reports.length}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="h-4 w-4 rounded border-ink-line"
                    aria-label={t("admin.orphans.selectAll")}
                  />
                </th>
                <th className="pb-3 pr-3">ID</th>
                <th className="pb-3 pr-3">{t("reports.form")}</th>
                <th className="pb-3 pr-3">User</th>
                <th className="pb-3 pr-3">Status</th>
                <th className="pb-3 pr-3">Foto</th>
                <th className="pb-3 pr-3">Snapped</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const status = statusConfig[r.status] ?? statusConfig.pending;
                const StatusIcon = status.icon;
                return (
                  <tr key={r.id} className="border-b border-ink-line last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="py-3 pr-2">
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggleOne(r.id)}
                        className="h-4 w-4 rounded border-ink-line"
                        aria-label={r.id}
                      />
                    </td>
                    <td className="py-3 pr-3 font-mono text-xs text-ink-muted">{r.id.slice(0, 8)}...</td>
                    <td className="py-3 pr-3 text-ink">
                      {formLabels[r.formSlug] ?? r.formSlug}
                      {r.isDummy && (
                        <span className="ml-1.5 chip bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-[10px]">Demo</span>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-ink-muted">{r.submitter?.name ?? "—"}</td>
                    <td className="py-3 pr-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-xs text-ink-muted">{r.photoCount}</td>
                    <td className="py-3 pr-3 font-mono text-xs text-ink-muted">
                      {r.snappedLat !== null && r.snappedLng !== null
                        ? `${r.snappedLat.toFixed(3)}, ${r.snappedLng.toFixed(3)}`
                        : "—"}
                    </td>
                    <td className="py-3 text-xs text-ink-muted">{new Date(r.createdAt).toLocaleDateString("id-ID")}</td>
                  </tr>
                );
              })}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-ink-muted">
                    {t("admin.orphans.empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-ink-line px-3 py-1 text-sm disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-xs text-ink-muted">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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