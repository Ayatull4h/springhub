"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, MapPin, Sparkles, Shield, FileText, LogOut, ArrowLeft } from "lucide-react";
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

  useEffect(() => {
    fetchProfile();
  }, []);

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
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1 rounded-md border border-ink-line px-3 py-1.5 text-sm text-ink-muted hover:bg-slate-100"
        >
          <LogOut className="h-4 w-4" /> {t("profile.logout")}
        </button>
      </div>

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
    </div>
  );
}
