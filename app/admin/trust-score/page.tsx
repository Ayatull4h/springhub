"use client";

import { useEffect, useState } from "react";
import { Search, Shield, ShieldAlert, ShieldCheck, RotateCcw, Save, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

type TrustUser = {
  id: string;
  email: string;
  username: string;
  role: string;
  region: string;
  points: number;
  trustScore: number;
  createdAt: string;
  _count: {
    reports: number;
  };
};

export default function AdminTrustScorePage() {
  const [users, setUsers] = useState<TrustUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const { t } = useI18n();

  const fetchUsers = () => {
    setLoading(true);
    fetch("/api/admin/trust-scores")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users ?? []);
        const vals: Record<string, string> = {};
        for (const u of data.users ?? []) {
          vals[u.id] = String(u.trustScore);
        }
        setEditValues(vals);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter((u) =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleSave = async (userId: string) => {
    const val = parseInt(editValues[userId], 10);
    if (isNaN(val) || val < 0 || val > 100) {
      showMsg(t("admin.trustScore.invalidValue"));
      return;
    }
    setSaving(userId);
    try {
      const res = await fetch(`/api/admin/trust-scores/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trustScore: val }),
      });
      if (res.ok) {
        showMsg(t("admin.trustScore.updated"));
        fetchUsers();
      } else {
        const err = await res.json();
        showMsg(err.error || t("admin.trustScore.updateFailed"));
      }
    } catch {
      showMsg(t("admin.trustScore.saveFailed"));
    } finally {
      setSaving(null);
    }
  };

  const handleReset = async (userId: string) => {
    try {
      const { token } = await fetch("/api/csrf").then(r => r.json());
      const res = await fetch(`/api/admin/trust-scores/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ trustScore: 50 }),
      });
      if (res.ok) {
        setEditValues((prev) => ({ ...prev, [userId]: "50" }));
        fetchUsers();
      }
    } catch {}
  };

  const getTrustIcon = (score: number) => {
    if (score >= 70) return ShieldCheck;
    if (score >= 30) return Shield;
    return ShieldAlert;
  };

  const getTrustColor = (score: number) => {
    if (score >= 70) return "text-emerald-600";
    if (score >= 30) return "text-amber-600";
    return "text-red-600";
  };

  const getTrustBg = (score: number) => {
    if (score >= 70) return "bg-emerald-50 dark:bg-emerald-900/20";
    if (score >= 30) return "bg-amber-50 dark:bg-amber-900/20";
    return "bg-red-50 dark:bg-red-900/20";
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
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
<h2 className="text-xl font-bold text-ink">{t("admin.trustScore.title")}</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {t("admin.trustScore.summary", { count: String(users.length), low: String(users.filter(u => u.trustScore < 30).length), blocked: String(users.filter(u => u.trustScore <= 0).length) })}
          </p>
        </div>
        <div className="relative self-start sm:self-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder={t("admin.trustScore.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 rounded-md border border-ink-line pl-9 pr-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="rounded-md bg-brand-50 dark:bg-brand-900/30 p-3 text-sm text-brand-700 dark:text-brand-300">
          {message}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card flex items-center gap-3 p-4">
          <ShieldCheck className="h-8 w-8 text-emerald-600" />
          <div>
            <div className="text-2xl font-bold text-ink">
              {users.filter((u) => u.trustScore >= 70).length}
            </div>
            <div className="text-xs text-ink-muted">{t("admin.trustScore.good")}</div>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <Shield className="h-8 w-8 text-amber-600" />
          <div>
            <div className="text-2xl font-bold text-ink">
              {users.filter((u) => u.trustScore >= 30 && u.trustScore < 70).length}
            </div>
            <div className="text-xs text-ink-muted">{t("admin.trustScore.medium")}</div>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <ShieldAlert className="h-8 w-8 text-red-600" />
          <div>
            <div className="text-2xl font-bold text-ink">
              {users.filter((u) => u.trustScore < 30).length}
            </div>
            <div className="text-xs text-ink-muted">{t("admin.trustScore.low")}</div>
          </div>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {filtered.map((u) => {
          const Icon = getTrustIcon(u.trustScore);
          const color = getTrustColor(u.trustScore);
          const bg = getTrustBg(u.trustScore);
          return (
            <div key={u.id} className="card space-y-2 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-ink">{u.username || "—"}</div>
                  <div className="text-xs text-ink-muted">{u.email}</div>
                </div>
                <div className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", bg, color)}>
                  <Icon className="h-3.5 w-3.5" />
                  {u.trustScore}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-ink-muted">
                <span className="chip capitalize">{u.role}</span>
                <span><Sparkles className="inline h-3 w-3" /> {u.points.toLocaleString("id-ID")} {t("admin.trustScore.pts")}</span>
                <span>Rejected: {u._count.reports}x</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editValues[u.id] ?? u.trustScore}
                  onChange={(e) =>
                    setEditValues((prev) => ({ ...prev, [u.id]: e.target.value }))
                  }
                  className="w-20 rounded-md border border-ink-line px-2 py-1 text-sm text-center dark:bg-slate-800 dark:text-white"
                />
                <button
                  onClick={() => handleSave(u.id)}
                  disabled={saving === u.id}
                  className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {saving === u.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3" />
                  )}
                  {t("admin.trustScore.save")}
                </button>
                <button
                  onClick={() => handleReset(u.id)}
                  className="rounded-md p-1.5 text-ink-muted hover:text-ink"
                  title={t("admin.trustScore.reset")}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-[900px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-ink-line text-xs font-medium text-ink-subtle">
                <th className="pb-3 pr-4">{t("admin.trustScore.user")}</th>
                <th className="pb-3 pr-4">{t("admin.trustScore.role")}</th>
                <th className="pb-3 pr-4">{t("admin.trustScore.region")}</th>
                <th className="pb-3 pr-4">{t("admin.trustScore.points")}</th>
                <th className="pb-3 pr-4">{t("admin.trustScore.rejected")}</th>
                <th className="pb-3 pr-4">{t("admin.trustScore.trustScore")}</th>
                <th className="pb-3 pr-4">{t("admin.trustScore.setValue")}</th>
                <th className="pb-3">{t("admin.trustScore.action")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const Icon = getTrustIcon(u.trustScore);
                const color = getTrustColor(u.trustScore);
                return (
                  <tr key={u.id} className="border-b border-ink-line last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-ink">{u.username || "—"}</div>
                      <div className="text-xs text-ink-muted">{u.email}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="chip capitalize text-xs">{u.role}</span>
                    </td>
                    <td className="py-3 pr-4 text-ink-muted text-xs">{u.region || "—"}</td>
                    <td className="py-3 pr-4 font-medium text-ink">
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-brand-600" />
                        {u.points.toLocaleString("id-ID")}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-ink-muted">{u._count.reports}x</td>
                    <td className="py-3 pr-4">
                      <span className={cn("inline-flex items-center gap-1 font-semibold", color)}>
                        <Icon className="h-4 w-4" />
                        {u.trustScore}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={editValues[u.id] ?? u.trustScore}
                        onChange={(e) =>
                          setEditValues((prev) => ({ ...prev, [u.id]: e.target.value }))
                        }
                        className="w-20 rounded-md border border-ink-line px-2 py-1 text-sm text-center dark:bg-slate-800 dark:text-white"
                      />
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSave(u.id)}
                          disabled={saving === u.id}
                          className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                        >
                          {saving === u.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Save className="h-3 w-3" />
                          )}
                          {t("admin.trustScore.save")}
                        </button>
                        <button
                          onClick={() => handleReset(u.id)}
                          className="rounded-md p-1.5 text-ink-muted hover:text-ink"
                          title={t("admin.trustScore.reset")}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-ink-muted">
                    {t("admin.trustScore.noUsers")}
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
