"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, MapPin, Shield, Sparkles, Download } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type UserItem = {
  id: string;
  email: string;
  username: string;
  role: string;
  phone: string;
  region: string;
  points: number;
  trustScore: number;
  createdAt: string;
};

export default function AdminUsersPage() {
  const { t } = useI18n();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [savingRole, setSavingRole] = useState(false);

  async function handleRoleSave(userId: string, newRole: string) {
    setSavingRole(true);
    try {
      const csrf = await fetch("/api/csrf").then(r => r.json()).catch(() => ({ token: "" }));
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf.token },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        const data = await fetch("/api/admin/users").then(r => r.json());
        setUsers(data.users ?? []);
      }
    } catch (e) {
      console.error("Failed to update role", e);
    } finally {
      setSavingRole(false);
      setEditingRole(null);
    }
  }

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = (p: number) => {
    setLoading(true);
    fetch(`/api/admin/users?page=${p}&limit=50`)
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        setPage(p);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(1); }, []);

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
          <h2 className="text-xl font-bold text-ink">{t("admin.users.title")}</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {t("admin.users.count", { count: String(total) })} · Halaman {page}/{totalPages}
          </p>
        </div>
        <button
          onClick={() => window.open("/api/admin/export?entity=users&format=csv", "_blank")}
          className="inline-flex items-center gap-1.5 rounded-md border border-ink-line px-3 py-2 text-sm font-medium text-ink-muted hover:bg-slate-100 hover:text-ink self-start sm:self-auto dark:hover:bg-slate-700"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

          {/* Mobile card view */}
      <div className="grid gap-3 md:hidden">
        {users.map((u) => (
          <div key={u.id} className="card space-y-2">
            <div className="flex items-start justify-between">
              <div className="font-medium text-ink">{u.username || "—"}</div>
              {editingRole === u.id ? (
                <div className="flex items-center gap-1">
                  <select
                    defaultValue={u.role}
                    onChange={(e) => handleRoleSave(u.id, e.target.value)}
                    disabled={savingRole}
                    className="rounded-md border border-ink-line px-2 py-1 text-xs dark:bg-slate-800 dark:text-white"
                  >
                    <option value="volunteer">Volunteer</option>
                    <option value="field_lead">⭐ ⭐ Field Lead</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button onClick={() => setEditingRole(null)} className="text-xs text-ink-muted hover:text-ink">Cancel</button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingRole(u.id)}
                  className="chip capitalize bg-brand-50 text-brand-700 hover:bg-brand-100 cursor-pointer dark:bg-brand-900/30 dark:text-brand-300 text-xs"
                >
                  {u.role}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs text-ink-muted">
              <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {u.email}</span>
              <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {u.phone || "—"}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {u.region || "—"}</span>
              <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3 text-brand-600" /> {u.points.toLocaleString("id-ID")}</span>
              <span className="inline-flex items-center gap-1"><Shield className="h-3 w-3 text-emerald-600" /> {u.trustScore}</span>
              <span className="text-ink-muted">{new Date(u.createdAt).toLocaleDateString("id-ID")}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-[900px]">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-ink-line text-xs font-medium text-ink-subtle">
              <th className="pb-3 pr-4">Username</th>
              <th className="pb-3 pr-4">Email</th>
              <th className="pb-3 pr-4">Phone</th>
              <th className="pb-3 pr-4">{t("admin.users.role")}</th>
              <th className="pb-3 pr-4">Region</th>
              <th className="pb-3 pr-4">Points</th>
              <th className="pb-3 pr-4">Trust</th>
              <th className="pb-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-ink-line last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800">
                <td className="py-3 pr-4 font-medium text-ink">{u.username || "—"}</td>
                <td className="py-3 pr-4 text-ink-muted">
                  <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {u.email}</span>
                </td>
                <td className="py-3 pr-4 text-ink-muted">
                  <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {u.phone || "—"}</span>
                </td>
                <td className="py-3 pr-4">
                  {editingRole === u.id ? (
                    <div className="flex items-center gap-1">
                      <select
                        defaultValue={u.role}
                        onChange={(e) => handleRoleSave(u.id, e.target.value)}
                        disabled={savingRole}
                        className="rounded-md border border-ink-line px-2 py-1 text-xs dark:bg-slate-800 dark:text-white"
                      >
                        <option value="volunteer">Volunteer</option>
                        <option value="field_lead">⭐ Field Lead</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button onClick={() => setEditingRole(null)} className="text-xs text-ink-muted hover:text-ink dark:hover:text-white">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setEditingRole(u.id)} className="chip capitalize bg-brand-50 text-brand-700 hover:bg-brand-100 cursor-pointer dark:bg-brand-900/30 dark:text-brand-300">{u.role}</button>
                  )}
                </td>
                <td className="py-3 pr-4 text-ink-muted">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {u.region || "—"}</span>
                </td>
                <td className="py-3 pr-4 font-medium text-ink">
                  <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3 text-brand-600" /> {u.points.toLocaleString("id-ID")}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center gap-1"><Shield className="h-3 w-3 text-emerald-600" /> {u.trustScore}</span>
                </td>
                <td className="py-3 text-xs text-ink-muted">{new Date(u.createdAt).toLocaleDateString("id-ID")}</td>
              </tr>
            ))}
          </tbody>
         </table>
        </div>
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => fetchUsers(page - 1)}
            disabled={page <= 1}
            className="rounded-md border border-ink-line px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-700"
          >
            ← {t("common.previous")}
          </button>
          <span className="text-xs text-ink-muted">
            {t("common.pageOf", { current: String(page), total: String(totalPages) })}
          </span>
          <button
            onClick={() => fetchUsers(page + 1)}
            disabled={page >= totalPages}
            className="rounded-md border border-ink-line px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-700"
          >
            {t("common.next")} →
          </button>
        </div>
      </div>
    </div>
  );
}
