"use client";

import { useEffect, useState } from "react";
import {
  Bug,
  MessageSquare,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import Image from "next/image";
import { useI18n } from "@/lib/i18n";

type FeedbackItem = {
  id: string;
  type: string;
  kritik: string;
  saran: string;
  bugDescription: string;
  bugScreenshot: string;
  status: string;
  userId: string | null;
  createdAt: string;
};

export default function AdminFeedbackPage() {
  const { t } = useI18n();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedback();
  }, []);

  async function fetchFeedback() {
    try {
      const res = await fetch("/api/admin/feedback");
      const data = await res.json();
      setFeedback(data.feedback ?? []);
    } catch (e) {
      console.error("Failed to load feedback:", e);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    await fetch(`/api/admin/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchFeedback();
  }

  const typeIcon: Record<string, any> = {
    bug: Bug,
    kritik: MessageSquare,
    saran: MessageSquare,
    both: MessageSquare,
  };

  const typeColor: Record<string, string> = {
    bug: "text-red-600 bg-red-50",
    kritik: "text-amber-600 bg-amber-50",
    saran: "text-blue-600 bg-blue-50",
    both: "text-purple-600 bg-purple-50",
  };

  const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
    open: { label: "Open", icon: Clock, className: "text-amber-600 bg-amber-50" },
    read: { label: "Read", icon: Eye, className: "text-blue-600 bg-blue-50" },
    resolved: { label: "Resolved", icon: CheckCircle2, className: "text-emerald-600 bg-emerald-50" },
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
      <div>
        <h2 className="text-xl font-bold text-ink">Feedback & Bug Reports</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Total: {feedback.length} submissions
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-ink-line text-xs font-medium text-ink-subtle">
              <th className="pb-2 pr-4">Type</th>
              <th className="pb-2 pr-4">Content</th>
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2 pr-4">Date</th>
              <th className="pb-2 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {feedback.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-ink-muted">
                  No feedback yet
                </td>
              </tr>
            ) : (
              feedback.map((item) => {
                const Icon = typeIcon[item.type] ?? MessageSquare;
                const status = statusConfig[item.status] ?? statusConfig.open;
                const StatusIcon = status.icon;
                const preview =
                  item.bugDescription?.slice(0, 80) ||
                  item.kritik?.slice(0, 80) ||
                  item.saran?.slice(0, 80) ||
                  "";
                return (
                  <tr key={item.id} className="border-b border-ink-line last:border-0">
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${typeColor[item.type] ?? "text-slate-600 bg-slate-50"}`}>
                        <Icon className="h-3 w-3" />
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="max-w-xs truncate text-ink">{preview}...</div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-ink-muted">
                      {new Date(item.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedId(selectedId === item.id ? null : item.id)}
                          className="rounded-md p-1 hover:bg-slate-100"
                          title="View detail"
                        >
                          <Eye className="h-4 w-4 text-ink-subtle" />
                        </button>
                        {item.status !== "read" && (
                          <button
                            onClick={() => updateStatus(item.id, "read")}
                            className="rounded-md px-2 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                          >
                            Mark Read
                          </button>
                        )}
                        {item.status !== "resolved" && (
                          <button
                            onClick={() => updateStatus(item.id, "resolved")}
                            className="rounded-md px-2 py-0.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          {(() => {
            const item = feedback.find((f) => f.id === selectedId);
            if (!item) return null;
            return (
              <div className="card max-w-lg w-full max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-ink">Feedback Detail</h3>
                  <button onClick={() => setSelectedId(null)} className="text-ink-subtle hover:text-ink text-xl">&times;</button>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-ink">Type:</span>{" "}
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${typeColor[item.type]}`}>
                      {item.type}
                    </span>
                  </div>
                  {item.bugDescription && (
                    <div>
                      <span className="font-medium text-ink">Bug Description:</span>
                      <p className="mt-1 whitespace-pre-wrap text-ink-muted">{item.bugDescription}</p>
                    </div>
                  )}
                  {item.kritik && (
                    <div>
                      <span className="font-medium text-ink">Kritik:</span>
                      <p className="mt-1 whitespace-pre-wrap text-ink-muted">{item.kritik}</p>
                    </div>
                  )}
                  {item.saran && (
                    <div>
                      <span className="font-medium text-ink">Saran:</span>
                      <p className="mt-1 whitespace-pre-wrap text-ink-muted">{item.saran}</p>
                    </div>
                  )}
                  {item.bugScreenshot && (
                    <div>
                      <span className="font-medium text-ink">Screenshot:</span>
                      <Image src={item.bugScreenshot} alt="Bug screenshot" width={600} height={400} className="mt-1 max-w-full rounded-md border" style={{ objectFit: "contain" }} />
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-ink">Date:</span>{" "}
                    <span className="text-ink-muted">{new Date(item.createdAt).toLocaleString("id-ID")}</span>
                  </div>
                  <div>
                    <span className="font-medium text-ink">Status:</span>{" "}
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig[item.status]?.className}`}>
                      {statusConfig[item.status]?.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
