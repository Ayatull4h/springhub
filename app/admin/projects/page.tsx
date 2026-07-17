"use client";

import { useEffect, useState, useCallback } from "react";
import {
  HardHat,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  X,
  Search,
  ArrowUpDown,
  MapPin,
  User,
  Mail,
  Phone,
  Target,
  Heart,
  Download,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn, formatNumber } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type ProjectItem = {
  id: string;
  title: string;
  summary: string;
  region: string;
  typeId: string;
  status: string;
  goalAmount: number;
  raisedAmount: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  proposalFile: string;
  createdAt: string;
  user: { id: string; username: string; email: string } | null;
  _count: { donations: number };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
  pending: { label: "Pending", icon: Clock, className: "text-amber-600 bg-amber-50 dark:bg-amber-900/30" },
  under_review: { label: "Under Review", icon: Eye, className: "text-blue-600 bg-blue-50 dark:bg-blue-900/30" },
  approved: { label: "Approved", icon: CheckCircle2, className: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" },
  rejected: { label: "Rejected", icon: XCircle, className: "text-red-600 bg-red-50 dark:bg-red-900/30" },
  completed: { label: "Completed", icon: CheckCircle2, className: "text-purple-600 bg-purple-50 dark:bg-purple-900/30" },
};

const statusFilters = ["all", "pending", "under_review", "approved", "rejected", "completed"] as const;

const typeLabels: Record<string, string> = {
  "spring-restoration": "Spring Restoration",
  "trench-development": "Trench Development",
  "tree-planting": "Tree Planting",
  "seedling-stock": "Seedling Stock",
  "community-cleanup": "Community Cleanup",
  "other": "Other",
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function ProjectDetailModal({
  project,
  open,
  onClose,
}: {
  project: ProjectItem | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!open || !project) return null;

  const status = statusConfig[project.status] ?? statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-4">
            <h3 className="text-lg font-bold text-ink">{project.title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", status.className)}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </span>
              <span className="chip bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 capitalize">{project.typeId}</span>
              {project.region && (
                <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                  <MapPin className="h-3 w-3" />
                  {project.region}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Summary */}
        {project.summary && (
          <p className="mt-4 text-sm text-ink-muted leading-relaxed">{project.summary}</p>
        )}

        {/* Financial Info */}
        <div className="mt-5 grid grid-cols-2 gap-4 rounded-lg bg-slate-50 dark:bg-slate-900 p-4">
          <div>
            <span className="text-xs font-medium text-ink-subtle">Goal Amount</span>
            <p className="mt-0.5 text-lg font-bold text-ink">
              Rp {formatNumber(project.goalAmount)}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-ink-subtle">Raised Amount</span>
            <p className="mt-0.5 text-lg font-bold text-brand-600">
              Rp {formatNumber(project.raisedAmount)}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-ink-subtle">Donations</span>
            <p className="mt-0.5 text-sm font-semibold text-ink">
              {project._count.donations} transactions
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-ink-subtle">Progress</span>
            <p className="mt-0.5 text-sm font-semibold text-ink">
              {project.goalAmount > 0
                ? Math.round((project.raisedAmount / project.goalAmount) * 100)
                : 0}%
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-4 space-y-2 rounded-lg border border-ink-line p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">Contact</h4>
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            {project.contactName && (
              <span className="inline-flex items-center gap-1.5 text-ink">
                <User className="h-3.5 w-3.5 text-ink-muted" />
                {project.contactName}
              </span>
            )}
            {project.contactEmail && (
              <span className="inline-flex items-center gap-1.5 text-ink">
                <Mail className="h-3.5 w-3.5 text-ink-muted" />
                {project.contactEmail}
              </span>
            )}
            {project.contactPhone && (
              <span className="inline-flex items-center gap-1.5 text-ink">
                <Phone className="h-3.5 w-3.5 text-ink-muted" />
                {project.contactPhone}
              </span>
            )}
          </div>
        </div>

        {/* Submitted by */}
        <div className="mt-3 text-xs text-ink-muted">
          <span>Submitted by </span>
          <span className="font-medium text-ink">
            {project.user?.username || "Guest"}
          </span>
          <span> · </span>
          <span>{new Date(project.createdAt).toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}</span>
        </div>

        {/* Close button */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md border border-ink-line px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Approve/Reject Modal ─────────────────────────────────────────────────────

function ActionModal({
  project,
  open,
  onClose,
  onAction,
}: {
  project: ProjectItem | null;
  open: boolean;
  onClose: () => void;
  onAction: (id: string, status: string, note: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setNote("");
      setSaving(false);
    }
  }, [open]);

  if (!open || !project) return null;

  const handleAction = async (status: string) => {
    setSaving(true);
    await onAction(project.id, status, note);
    setSaving(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink">Review Project</h3>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2 text-sm text-ink-muted">
          <strong className="text-ink">{project.title}</strong>
        </p>

        <div className="mt-4">
          <label className="block text-sm font-medium text-ink">Review Note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-800 dark:text-white"
            placeholder="Add a note about your decision..."
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => handleAction("rejected")}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-red-50 dark:bg-red-900/30 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Reject
          </button>
          <button
            onClick={() => handleAction("under_review")}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 dark:bg-blue-900/30 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            Under Review
          </button>
          <button
            onClick={() => handleAction("approved")}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminProjectsPage() {
  const { t } = useI18n();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [detailProject, setDetailProject] = useState<ProjectItem | null>(null);
  const [actionProject, setActionProject] = useState<ProjectItem | null>(null);
  const [actionMsg, setActionMsg] = useState("");

  const fetchProjects = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/projects")
      .then((r) => r.json())
      .then((data) => setProjects(data.projects ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  async function handleAction(id: string, status: string, note: string) {
    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
      if (res.ok) {
        setActionMsg(`Project ${status === "approved" ? "approved" : status === "rejected" ? "rejected" : "moved to " + status} successfully!`);
        fetchProjects();
      } else {
        const data = await res.json();
        setActionMsg(data.error || "Failed to update project");
      }
    } catch {
      setActionMsg("An error occurred");
    }
    setTimeout(() => setActionMsg(""), 4000);
  }

  // Filter & sort
  const filtered = projects
    .filter((p) => statusFilter === "all" || p.status === statusFilter)
    .filter(
      (p) =>
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case "title": aVal = a.title; bVal = b.title; break;
        case "goalAmount": aVal = a.goalAmount; bVal = b.goalAmount; break;
        case "raisedAmount": aVal = a.raisedAmount; bVal = b.raisedAmount; break;
        case "region": aVal = a.region; bVal = b.region; break;
        default: aVal = a.createdAt; bVal = b.createdAt;
      }
      if (typeof aVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />;
    return (
      <ArrowUpDown
        className={cn(
          "ml-1 h-3 w-3 transition",
          sortDir === "asc" ? "rotate-180" : ""
        )}
      />
    );
  };

  const totalGoal = filtered.reduce((sum, p) => sum + p.goalAmount, 0);
  const totalRaised = filtered.reduce((sum, p) => sum + p.raisedAmount, 0);

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">Projects</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {filtered.length} project{filtered.length !== 1 ? "s" : ""}
            {projects.length !== filtered.length && ` (filtered from ${projects.length})`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open("/api/admin/export?entity=projects&format=csv", "_blank")}
            className="inline-flex items-center gap-1.5 rounded-md border border-ink-line px-3 py-2 text-sm font-medium text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-ink"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-ink-line bg-white dark:bg-slate-800 p-3">
          <span className="text-xs font-medium text-ink-muted">Total (filtered)</span>
          <p className="mt-1 text-lg font-bold text-ink">{filtered.length}</p>
        </div>
        <div className="rounded-lg border border-ink-line bg-white dark:bg-slate-800 p-3">
          <span className="text-xs font-medium text-ink-muted">Goal Amount</span>
          <p className="mt-1 text-lg font-bold text-ink">Rp {formatNumber(totalGoal)}</p>
        </div>
        <div className="rounded-lg border border-ink-line bg-white dark:bg-slate-800 p-3">
          <span className="text-xs font-medium text-ink-muted">Raised Amount</span>
          <p className="mt-1 text-lg font-bold text-brand-600">Rp {formatNumber(totalRaised)}</p>
        </div>
        <div className="rounded-lg border border-ink-line bg-white dark:bg-slate-800 p-3">
          <span className="text-xs font-medium text-ink-muted">Avg Progress</span>
          <p className="mt-1 text-lg font-bold text-ink">
            {totalGoal > 0 ? Math.round((totalRaised / totalGoal) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition",
                statusFilter === s
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-ink-muted hover:bg-slate-200 dark:hover:bg-slate-600"
              )}
            >
              {s === "all" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-ink-line pl-9 pr-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 sm:w-72 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div className="rounded-md bg-brand-50 p-3 text-sm text-brand-700">
          {actionMsg}
        </div>
      )}

      {/* Mobile card view */}
      <div className="grid gap-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="card py-12 text-center text-sm text-ink-muted">
            <HardHat className="mx-auto h-8 w-8 text-ink-subtle" />
            <p className="mt-2">No projects found</p>
          </div>
        ) : (
          filtered.map((p) => {
            const status = statusConfig[p.status] ?? statusConfig.pending;
            const StatusIcon = status.icon;
            return (
              <div key={p.id} className="card space-y-2 cursor-pointer" onClick={() => setDetailProject(p)}>
                <div className="flex items-start justify-between">
                  <div className="font-medium text-ink text-sm">{p.title}</div>
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", status.className)}>
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <span className="chip bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 capitalize">
                    {typeLabels[p.typeId] || p.typeId.replace(/-/g, " ")}
                  </span>
                  {p.region && <span className="inline-flex items-center gap-1 text-ink-muted"><MapPin className="h-3 w-3" />{p.region}</span>}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-muted">{p.user?.username || "Guest"}</span>
                  <span className="text-ink-muted">{new Date(p.createdAt).toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span>Goal: <strong>Rp {formatNumber(p.goalAmount)}</strong></span>
                  <span>Raised: <strong className="text-brand-600">Rp {formatNumber(p.raisedAmount)}</strong></span>
                  {p.goalAmount > 0 && <span>({Math.round((p.raisedAmount / p.goalAmount) * 100)}%)</span>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-ink-line bg-white dark:bg-slate-800">
          <div className="min-w-[900px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
            <tr className="border-b border-ink-line bg-slate-50 dark:bg-slate-900 text-xs font-medium text-ink-subtle">
              <th className="pb-3 pl-4 pr-3">
                <button onClick={() => toggleSort("title")} className="inline-flex items-center hover:text-ink">Title <SortIcon field="title" /></button>
              </th>
              <th className="pb-3 pr-3">Type</th>
              <th className="pb-3 pr-3">Status</th>
              <th className="pb-3 pr-3">
                <button onClick={() => toggleSort("region")} className="inline-flex items-center hover:text-ink">Region <SortIcon field="region" /></button>
              </th>
              <th className="pb-3 pr-3">
                <button onClick={() => toggleSort("goalAmount")} className="inline-flex items-center hover:text-ink">Goal (Rp) <SortIcon field="goalAmount" /></button>
              </th>
              <th className="pb-3 pr-3">
                <button onClick={() => toggleSort("raisedAmount")} className="inline-flex items-center hover:text-ink">Raised (Rp) <SortIcon field="raisedAmount" /></button>
              </th>
              <th className="pb-3 pr-3">Contact</th>
              <th className="pb-3 pr-4">
                <button onClick={() => toggleSort("createdAt")} className="inline-flex items-center hover:text-ink">Date <SortIcon field="createdAt" /></button>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-sm text-ink-muted">
                  <HardHat className="mx-auto h-8 w-8 text-ink-subtle" />
                  <p className="mt-2">No projects found</p>
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const status = statusConfig[p.status] ?? statusConfig.pending;
                const StatusIcon = status.icon;
                return (
                  <tr key={p.id} className="border-b border-ink-line last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer" onClick={() => setDetailProject(p)}>
                    <td className="py-3 pl-4 pr-3">
                      <div className="flex items-center gap-2">
                        <HardHat className="h-4 w-4 flex-shrink-0 text-ink-muted" />
                        <div>
                          <p className="font-medium text-ink line-clamp-2">{p.title}</p>
                          <p className="text-xs text-ink-muted">{p.user?.username || "Guest"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="chip bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs capitalize">
                        {typeLabels[p.typeId] || t("projects.type." + p.typeId.replace(/-/g, "_")) || p.typeId.replace(/-/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", status.className)}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="inline-flex items-center gap-1 text-xs text-ink-muted"><MapPin className="h-3 w-3" />{p.region || "—"}</span>
                    </td>
                    <td className="py-3 pr-3 font-medium text-ink">Rp {formatNumber(p.goalAmount)}</td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-brand-600">Rp {formatNumber(p.raisedAmount)}</span>
                        {p.goalAmount > 0 && <span className="text-xs text-ink-muted">({Math.round((p.raisedAmount / p.goalAmount) * 100)}%)</span>}
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-xs text-ink-muted">{p.contactName || p.contactEmail || "—"}</td>
                    <td className="py-3 pr-4 text-xs text-ink-muted">
                      {new Date(p.createdAt).toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Action button bar for selected project */}
      {detailProject && detailProject.status !== "completed" && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => {
              setActionProject(detailProject);
              setDetailProject(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Target className="h-4 w-4" />
            Review & Approve / Reject
          </button>
        </div>
      )}

      {/* Modals */}
      <ProjectDetailModal
        project={detailProject}
        open={detailProject !== null && actionProject === null}
        onClose={() => setDetailProject(null)}
      />

      <ActionModal
        project={actionProject}
        open={actionProject !== null}
        onClose={() => setActionProject(null)}
        onAction={handleAction}
      />
    </div>
  );
}
