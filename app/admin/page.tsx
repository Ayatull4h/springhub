"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  FileText,
  Heart,
  HardHat,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
  Download,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type ReportItem = {
  id: string;
  formSlug: string;
  status: string;
  user: { username: string } | null;
  createdAt: string;
};

export default function AdminDashboard() {
  const { t } = useI18n();
  const [stats, setStats] = useState({ users: 0, reports: 0, donations: 0, projects: 0 });
  const [recentReports, setRecentReports] = useState<ReportItem[]>([]);
  const [recentUsers, setRecentUsers] = useState<{ id: string; username: string; role: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/reports").then((r) => r.json()),
      fetch("/api/admin/donations").then((r) => r.json()),
      fetch("/api/admin/projects").then((r) => r.json()),
    ])
      .then(([usersData, reportsData, donationsData, projectsData]) => {
        const allUsers = usersData.users ?? [];
        const sorted = [...allUsers].sort(
          (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setStats({
          users: allUsers.length,
          reports: reportsData.reports?.length ?? 0,
          donations: donationsData.donations?.length ?? 0,
          projects: projectsData.projects?.length ?? 0,
        });
        setRecentReports((reportsData.reports ?? []).slice(0, 10));
        setRecentUsers(sorted.slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
    approved: { label: t("admin.status.approved"), icon: CheckCircle2, className: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300" },
    pending: { label: t("admin.status.pending"), icon: Clock, className: "text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300" },
    rejected: { label: t("admin.status.rejected"), icon: XCircle, className: "text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300" },
  };

  const statCards = [
    { label: t("admin.totalUsers"), value: stats.users.toString(), change: "Registered", icon: Users, color: "text-blue-600" },
    { label: t("admin.totalReports"), value: stats.reports.toString(), change: "All time", icon: FileText, color: "text-emerald-600" },
    { label: t("admin.donations"), value: stats.donations.toString(), change: "Total transactions", icon: Heart, color: "text-rose-600" },
    { label: t("admin.activeProjects"), value: stats.projects.toString(), change: "All time", icon: HardHat, color: "text-amber-600" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink">{t("admin.dashboard")}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t("admin.welcome")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-muted">{s.label}</span>
                <Icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className="mt-2 text-2xl font-bold text-ink">{s.value}</div>
              <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                <ArrowUpRight className="h-3 w-3" />
                {s.change}
              </div>
            </div>
          );
        })}
      </div>

      {/* Export Section */}
      <div className="card">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Export Data</h3>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => window.open("/api/admin/export?entity=users&format=csv", "_blank")}
            className="inline-flex items-center gap-1.5 rounded-md border border-ink-line px-3 py-2 text-sm font-medium text-ink-muted hover:bg-slate-100 hover:text-ink dark:hover:bg-slate-700"
          >
            <Download className="h-4 w-4" />
            Export Users CSV
          </button>
          <button
            onClick={() => window.open("/api/admin/export?entity=reports&format=csv", "_blank")}
            className="inline-flex items-center gap-1.5 rounded-md border border-ink-line px-3 py-2 text-sm font-medium text-ink-muted hover:bg-slate-100 hover:text-ink dark:hover:bg-slate-700"
          >
            <Download className="h-4 w-4" />
            Export Reports CSV
          </button>
          <button
            onClick={() => window.open("/api/admin/export?entity=donations&format=csv", "_blank")}
            className="inline-flex items-center gap-1.5 rounded-md border border-ink-line px-3 py-2 text-sm font-medium text-ink-muted hover:bg-slate-100 hover:text-ink dark:hover:bg-slate-700"
          >
            <Download className="h-4 w-4" />
            Export Donations CSV
          </button>
          <button
            onClick={() => window.open("/api/admin/export?entity=projects&format=csv", "_blank")}
            className="inline-flex items-center gap-1.5 rounded-md border border-ink-line px-3 py-2 text-sm font-medium text-ink-muted hover:bg-slate-100 hover:text-ink dark:hover:bg-slate-700"
          >
            <Download className="h-4 w-4" />
            Export Projects CSV
          </button>
        </div>
      </div>

      {/* Recent Registrations */}
      <div className="card">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Recent Registrations</h3>
          <Link href="/admin/users" className="text-xs font-medium text-brand-600 hover:text-brand-700">
            {t("admin.viewAll")}
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-ink-line text-xs font-medium text-ink-subtle">
                <th className="pb-2 pr-4">Username</th>
                <th className="pb-2 pr-4">Role</th>
                <th className="pb-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => (
                <tr key={u.id} className="border-b border-ink-line last:border-0">
                  <td className="py-3 pr-4 text-ink">{u.username}</td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 text-ink-muted">
                    {new Date(u.createdAt).toLocaleDateString("id-ID")}
                  </td>
                </tr>
              ))}
              {recentUsers.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-sm text-ink-muted">
                    No users yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">{t("admin.recentReports")}</h3>
          <Link href="/admin/reports" className="text-xs font-medium text-brand-600 hover:text-brand-700">
            {t("admin.viewAll")}
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[600px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-ink-line text-xs font-medium text-ink-subtle">
                <th className="pb-2 pr-4">ID</th>
                <th className="pb-2 pr-4">{t("reports.form")}</th>
                <th className="pb-2 pr-4">User</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentReports.map((r) => {
                const status = statusConfig[r.status] ?? statusConfig.pending;
                const StatusIcon = status.icon;
                return (
                  <tr key={r.id} className="border-b border-ink-line last:border-0">
                    <td className="py-3 pr-4 font-mono text-xs text-ink-muted">
                      {r.id.slice(0, 8)}...
                    </td>
                    <td className="py-3 pr-4 text-ink">{r.formSlug}</td>
                    <td className="py-3 pr-4 text-ink-muted">{r.user?.username ?? t("common.guest")}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3 text-ink-muted">
                      {new Date(r.createdAt).toLocaleDateString("id-ID")}
                    </td>
                  </tr>
                );
              })}
              {recentReports.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-ink-muted">
                    {t("admin.noReports")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>
  );
}
