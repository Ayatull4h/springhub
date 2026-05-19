"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, MapPin, Sparkles, Shield, FileText, LogOut, ArrowLeft, Pencil, X, Check, Eye, EyeOff, Loader2, Bell, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

type ProfileData = {
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

type ReportItem = {
  id: string;
  formSlug: string;
  status: string;
  createdAt: string;
};

type PointsLogItem = {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useI18n();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [pointsLogs, setPointsLogs] = useState<PointsLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [claimResult, setClaimResult] = useState<{ claimed: number } | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [claimTried, setClaimTried] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    handleClaimGuest();
  }, []);

  async function handleClaimGuest() {
    if (claimTried) return;
    setClaiming(true);
    setClaimError("");
    try {
      const res = await fetch("/api/auth/claim-guest", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setClaimResult(data);
        if (data.claimed > 0) fetchProfile();
      } else {
        setClaimError(data.error || "Gagal mengklaim");
      }
    } catch {
      setClaimError("Kesalahan jaringan");
    } finally {
      setClaiming(false);
      setClaimTried(true);
    }
  }

  async function fetchProfile() {
    try {
      const res = await fetch("/api/user/profile");
      if (res.status === 401) {
        router.push("/sign-in?redirect=/profile");
        return;
      }
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setReports(data.reports ?? []);
        setPointsLogs(data.pointsLogs ?? []);
      }
    } catch (e) {
      console.error("Failed to fetch profile:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  function openEdit() {
    setEditUsername(profile?.username ?? "");
    setEditRegion(profile?.region ?? "");
    setCurrentPassword("");
    setNewPassword("");
    setSaveError("");
    setSaveSuccess("");
    setEditing(true);
  }

  function closeEdit() {
    setEditing(false);
    setSaveError("");
    setSaveSuccess("");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaveSuccess("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editUsername || undefined,
          region: editRegion || undefined,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "Gagal menyimpan");
        return;
      }
      setSaveSuccess(t("profile.editSaved"));
      setProfile((prev) => prev ? { ...prev, username: data.user.username, region: data.user.region } : prev);
      setTimeout(() => { closeEdit(); setSaveSuccess(""); }, 1500);
    } catch {
      setSaveError(t("profile.editError"));
    } finally {
      setSaving(false);
    }
  }

  const statusColor: Record<string, string> = {
    approved: "text-emerald-600 bg-emerald-50",
    pending: "text-amber-600 bg-amber-50",
    rejected: "text-red-600 bg-red-50",
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container-page py-12 text-center">
        <p className="text-ink-muted">{t("profile.signInPrompt")}</p>
        <Link href="/sign-in?redirect=/profile" className="btn-primary mt-4 inline-flex">
          {t("profile.signIn")}
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page max-w-4xl py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> {t("profile.backToHome")}
      </Link>

      {/* Claim Guest Reports Banner */}
      {claimTried && claimResult && claimResult.claimed > 0 && (
        <div className="mt-6 rounded-md bg-emerald-50 p-4 text-sm text-emerald-700 ring-1 ring-emerald-200">
          ✅ {t("profile.claimSuccess", { count: String(claimResult.claimed) })}
        </div>
      )}
      {claimTried && claimError && (
        <div className="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
          {claimError}
        </div>
      )}
      {claimTried && claimResult && claimResult.claimed === 0 && (
        <div className="mt-6 rounded-md bg-amber-50 p-4 text-sm text-amber-700 ring-1 ring-amber-200">
          {t("profile.claimNone")}
        </div>
      )}
      {!claimTried && claiming && (
        <div className="mt-6 flex items-center gap-2 rounded-md bg-brand-50 p-4 text-sm text-brand-700 ring-1 ring-brand-200">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          {t("profile.claiming")}
        </div>
      )}

      {/* Profile Header */}
      <div className="mt-6 card flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
            {profile.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-ink">{profile.username}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> {profile.email}
              </span>
              {profile.region && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {profile.region}
                </span>
              )}
              <span className="chip bg-brand-50 text-brand-700 capitalize">{profile.role}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openEdit}
            className="inline-flex items-center gap-1 rounded-md border border-brand-600 px-3 py-1.5 text-sm text-brand-600 hover:bg-brand-50"
          >
            <Pencil className="h-4 w-4" /> {t("profile.edit")}
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1 rounded-md border border-ink-line px-3 py-1.5 text-sm text-ink-muted hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" /> {t("profile.logout")}
          </button>
        </div>
      </div>

      {/* Edit Profile Form */}
      {editing && (
        <form onSubmit={handleSave} className="mt-6 card border border-brand-200 bg-brand-50/40">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-ink">{t("profile.editTitle")}</h2>
            <button type="button" onClick={closeEdit} className="rounded-md p-1 text-ink-muted hover:bg-brand-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          {saveSuccess && (
            <div className="mb-4 rounded-md bg-emerald-50 px-4 py-2 text-sm text-emerald-700 flex items-center gap-2">
              <Check className="h-4 w-4" /> {saveSuccess}
            </div>
          )}
          {saveError && (
            <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{saveError}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">{t("profile.editUsername")}</label>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="input w-full"
                required
                minLength={2}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">{t("profile.editRegion")}</label>
              <input
                type="text"
                value={editRegion}
                onChange={(e) => setEditRegion(e.target.value)}
                className="input w-full"
              />
            </div>
            <hr className="border-ink-line" />
            <p className="text-xs text-ink-muted">{t("profile.editPasswordHint")}</p>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">{t("profile.editCurrentPassword")}</label>
              <div className="relative">
                <input
                  type={showCurrentPw ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input w-full pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                >
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">{t("profile.editNewPassword")}</label>
              <div className="relative">
                <input
                  type={showNewPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input w-full pr-10"
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                >
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={closeEdit} className="btn-secondary text-sm">
              {t("profile.editCancel")}
            </button>
            <button type="submit" disabled={saving} className="btn-primary text-sm inline-flex items-center gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? t("profile.editSaving") : t("profile.editSave")}
            </button>
          </div>
        </form>
      )}

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card text-center">
          <Sparkles className="mx-auto h-5 w-5 text-brand-600" />
          <div className="mt-2 text-2xl font-bold text-ink">{profile.points.toLocaleString("id-ID")}</div>
          <div className="text-xs text-ink-muted">{t("profile.totalPoints")}</div>
        </div>
        <div className="card text-center">
          <Shield className="mx-auto h-5 w-5 text-emerald-600" />
          <div className="mt-2 text-2xl font-bold text-ink">{profile.trustScore}</div>
          <div className="text-xs text-ink-muted">{t("profile.trustScore")}</div>
        </div>
        <div className="card text-center">
          <FileText className="mx-auto h-5 w-5 text-amber-600" />
          <div className="mt-2 text-2xl font-bold text-ink">{reports.length}</div>
          <div className="text-xs text-ink-muted">{t("profile.reportsSubmitted")}</div>
        </div>
      </div>

      {/* Reports */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-ink">{t("profile.myReports")}</h2>
        {reports.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">{t("profile.noReports")}</p>
        ) : (
          <div className="mt-3 space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="card flex items-center justify-between">
                <div>
                  <span className="font-medium text-ink">
                    {formLabels[r.formSlug] ?? r.formSlug}
                  </span>
                  <span className="ml-2 text-xs text-ink-muted">
                    {new Date(r.createdAt).toLocaleDateString("id-ID")}
                  </span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    statusColor[r.status] ?? "text-slate-600 bg-slate-50"
                  }`}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Points History */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-ink">{t("profile.pointsHistory")}</h2>
        {pointsLogs.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">{t("profile.noPointsHistory")}</p>
        ) : (
          <div className="mt-3 space-y-1">
            {pointsLogs.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-slate-50">
                <div>
                  <span className="text-ink">{p.reason}</span>
                  <span className="ml-2 text-xs text-ink-subtle">
                    {new Date(p.createdAt).toLocaleDateString("id-ID")}
                  </span>
                </div>
                <span className="font-medium text-brand-600">+{p.amount}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {(() => {
        const activityItems: { id: string; message: string; icon: typeof Sparkles; time: string; color: string }[] = [];
        pointsLogs.forEach((p) => {
          activityItems.push({
            id: `p-${p.id}`,
            message: `+${p.amount} pts: ${p.reason}`,
            icon: Sparkles,
            time: p.createdAt,
            color: "text-brand-600",
          });
        });
        reports.forEach((r) => {
          if (r.status === "approved" || r.status === "rejected") {
            activityItems.push({
              id: `r-${r.id}`,
              message: `Laporan ${r.formSlug} ${r.status === "approved" ? "disetujui" : "ditolak"}`,
              icon: r.status === "approved" ? CheckCircle2 : XCircle,
              time: r.createdAt,
              color: r.status === "approved" ? "text-emerald-600" : "text-red-600",
            });
          }
        });
        activityItems.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        const top = activityItems.slice(0, 10);

        return (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-ink">{t("profile.recentActivity")}</h2>
            {top.length === 0 ? (
              <p className="mt-2 text-sm text-ink-muted">{t("profile.noActivity")}</p>
            ) : (
              <div className="mt-3 space-y-1">
                {top.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-slate-50">
                      <Icon className={`h-4 w-4 shrink-0 ${item.color}`} />
                      <div className="flex-1">
                        <span className="text-ink">{item.message}</span>
                      </div>
                      <span className="text-xs text-ink-subtle whitespace-nowrap">
                        {new Date(item.time).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
