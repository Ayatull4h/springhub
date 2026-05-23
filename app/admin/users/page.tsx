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
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => setUsers(data.users ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
            {t("admin.users.count", { count: String(users.length) })}
          </p>
        </div>
        <button
          onClick={() => window.open("/api/admin/export?entity=users&format=csv", "_blank")}
          className="inline-flex items-center gap-1.5 rounded-md border border-ink-line px-3 py-2 text-sm font-medium text-ink-muted hover:bg-slate-100 hover:text-ink self-start sm:self-auto"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
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
              <tr key={u.id} className="border-b border-ink-line last:border-0 hover:bg-slate-50">
                <td className="py-3 pr-4 font-medium text-ink">{u.username || "—"}</td>
                <td className="py-3 pr-4 text-ink-muted">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {u.email}
                  </span>
                </td>
                <td className="py-3 pr-4 text-ink-muted">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {u.phone || "—"}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  {editingRole === u.id ? (
                    <div className="flex items-center gap-1">
                      <select
                        defaultValue={u.role}
                        onChange={(e) => {
                          handleRoleSave(u.id, e.target.value);
                        }}
                        disabled={savingRole}
                        className="rounded-md border border-ink-line px-2 py-1 text-xs"
                      >
                        <option value="user">User</option>
                        <option value="volunteer">Volunteer</option>
                        <option value="field_lead">Field Lead</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => setEditingRole(null)}
                        className="text-xs text-ink-muted hover:text-ink"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingRole(u.id)}
                      className="chip capitalize bg-brand-50 text-brand-700 hover:bg-brand-100 cursor-pointer"
                    >
                      {u.role}
                    </button>
                  )}
                </td>
                <td className="py-3 pr-4 text-ink-muted">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {u.region || "—"}
                  </span>
                </td>
                <td className="py-3 pr-4 font-medium text-ink">
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-brand-600" /> {u.points.toLocaleString("id-ID")}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center gap-1">
                    <Shield className="h-3 w-3 text-emerald-600" /> {u.trustScore}
                  </span>
                </td>
                <td className="py-3 text-xs text-ink-muted">
                  {new Date(u.createdAt).toLocaleDateString("id-ID")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
