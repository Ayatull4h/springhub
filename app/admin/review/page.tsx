"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, MapPin, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type ReportItem = {
  id: string;
  formSlug: string;
  status: string;
  fieldData: string;
  preciseLat: number | null;
  preciseLng: number | null;
  snappedLat: number | null;
  snappedLng: number | null;
  createdAt: string;
  user: { username: string } | null;
  guestId: string | null;
};

export default function AdminReviewPage() {
  const { t } = useI18n();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  const formLabels: Record<string, string> = {
    "spring-monitoring": t("profile.form.springMonitoring"),
    "spring-restoration": t("profile.form.springRestoration"),
    "trench-development": t("profile.form.trenchDevelopment"),
    "tree-planting": t("profile.form.treePlanting"),
    "seedling-stock": t("profile.form.seedlingStock"),
  };

  const fetchPending = () => {
    setLoading(true);
    fetch("/api/admin/reports")
      .then((r) => r.json())
      .then((data) => {
        setReports((data.reports ?? []).filter((r: ReportItem) => r.status === "pending"));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPending();
  }, []);

  async function handleApprove(id: string) {
    setProcessing((p) => ({ ...p, [id]: true }));
    try {
      const res = await fetch(`/api/admin/reports/${id}/approve`, { method: "POST" });
      if (res.ok) {
        setActionMsg(t("admin.reviews.approve") + "!");
        fetchPending();
      } else {
        const data = await res.json();
        setActionMsg(data.error || t("common.error"));
      }
    } catch {
      setActionMsg(t("common.error"));
    }
    setProcessing((p) => ({ ...p, [id]: false }));
    setTimeout(() => setActionMsg(""), 3000);
  }

  async function handleReject(id: string) {
    setProcessing((p) => ({ ...p, [id]: true }));
    try {
      const res = await fetch(`/api/admin/reports/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: notes[id] || "" }),
      });
      if (res.ok) {
        setActionMsg(t("admin.reviews.reject") + "ed");
        fetchPending();
      } else {
        const data = await res.json();
        setActionMsg(data.error || t("common.error"));
      }
    } catch {
      setActionMsg(t("common.error"));
    }
    setProcessing((p) => ({ ...p, [id]: false }));
    setTimeout(() => setActionMsg(""), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-ink">{t("admin.reviews.title")}</h2>
        <p className="mt-1 text-sm text-ink-muted">
          {t("admin.reviews.count", { count: String(reports.length) })}
        </p>
      </div>

      {actionMsg && (
        <div className="rounded-md bg-brand-50 p-3 text-sm text-brand-700">
          {actionMsg}
        </div>
      )}

      {reports.length === 0 ? (
        <div className="card py-12 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
          <p className="mt-2 text-sm text-ink-muted">{t("admin.reviews.allReviewed")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            let fieldData: Record<string, unknown> = {};
            try { fieldData = JSON.parse(r.fieldData || "{}"); } catch { fieldData = {}; }
            return (
              <div key={r.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="chip bg-brand-50 text-brand-700">
                      {formLabels[r.formSlug] ?? r.formSlug}
                    </span>
                    <span className="ml-2 text-sm text-ink-muted">
                      {t("common.by")} {r.user?.username ?? `${t("common.guest")} (${r.guestId?.slice(0, 8)}...)`}
                    </span>
                  </div>
                  <span className="text-xs text-ink-muted">
                    {new Date(r.createdAt).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Field data preview */}
                <div className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                  {Object.entries(fieldData).slice(0, 6).map(([key, val]) => (
                    <div key={key} className="text-xs">
                      <span className="text-ink-subtle">{key}: </span>
                      <span className="text-ink">
                        {Array.isArray(val) ? val.join(", ") : String(val).slice(0, 50)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Location */}
                {(r.preciseLat || r.snappedLat) && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
                    <MapPin className="h-3 w-3" />
                    <span className="font-mono">
                      Precise: {r.preciseLat?.toFixed(4)}, {r.preciseLng?.toFixed(4)}
                    </span>
                    <span className="text-ink-subtle">|</span>
                    <span className="font-mono">
                      Snapped: {r.snappedLat?.toFixed(3)}, {r.snappedLng?.toFixed(3)}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-line pt-3">
                  <input
                    type="text"
                    placeholder={t("admin.reviews.notePlaceholder")}
                    value={notes[r.id] || ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                    className="flex-1 min-w-[200px] rounded-md border border-ink-line px-3 py-1.5 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                  <button
                    onClick={() => handleApprove(r.id)}
                    disabled={processing[r.id]}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                  >
                    {processing[r.id] ? (
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    {t("admin.reviews.approve")}
                  </button>
                  <button
                    onClick={() => handleReject(r.id)}
                    disabled={processing[r.id]}
                    className="inline-flex items-center gap-1 rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    {processing[r.id] ? (
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-700 border-t-transparent" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    {t("admin.reviews.reject")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
