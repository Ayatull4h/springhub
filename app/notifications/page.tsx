"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ArrowLeft, Loader2, BellOff, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  link: string;
  createdAt: string;
};

export default function NotificationsPage() {
  const { t } = useI18n();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    try {
      setError("");
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error(t("notifications.loadError", "Gagal memuat notifikasi"));
      const data = await res.json();
      setNotifications(data.notifications ?? []);
    } catch {
      setError(t("notifications.loadErrorDesc", "Gagal memuat notifikasi. Coba lagi nanti."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // silently fail
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    await Promise.all(unread.map((n) => markAsRead(n.id)));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "points-earned":
        return "🎯";
      case "report-approved":
        return "✅";
      case "report-rejected":
        return "❌";
      case "submission-sent":
        return "📤";
      case "project-verified":
        return "📋";
      case "event":
        return "📅";
      case "draft":
        return "📝";
      default:
        return "🔔";
    }
  };

  if (loading) {
    return (
      <div className="container-page flex min-h-[50vh] items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="container-page max-w-2xl py-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-md p-2 text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Kembali ke beranda"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-ink">{t("notifications.title", "Notifikasi")}</h1>
            <p className="text-sm text-ink-muted">
              {t("notifications.subtitle", "Aktivitas dan pemberitahuan akun kamu")}
            </p>
          </div>
        </div>

        {notifications.filter((n) => !n.isRead).length > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20"
          >
            <CheckCheck className="h-4 w-4" />
            {t("notifications.markAllRead", "Tandai semua dibaca")}
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {notifications.length === 0 && !error ? (
        <div className="mt-12 text-center">
          <BellOff className="mx-auto h-12 w-12 text-ink-muted" />
          <h2 className="mt-3 text-lg font-semibold text-ink">{t("notifications.emptyTitle", "Belum ada notifikasi")}</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {t("notifications.emptyDesc", "Notifikasi tentang laporan, poin, dan aktivitas akan muncul di sini.")}
          </p>
          <Link href="/" className="btn-primary mt-6 inline-flex">
            {t("notifications.backToHome", "Kembali ke Beranda")}
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 rounded-xl border p-4 transition ${
                n.isRead
                  ? "border-ink-line bg-white dark:bg-slate-800"
                  : "border-brand-200 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/20"
              }`}
            >
              <span className="mt-0.5 text-lg" role="img" aria-label={n.type}>
                {getTypeIcon(n.type)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold text-ink">{n.title}</span>
                    {!n.isRead && (
                      <span className="ml-2 inline-block h-2 w-2 rounded-full bg-brand-500" />
                    )}
                  </div>
                  <span className="flex-none text-xs text-ink-subtle">
                    {formatTimeAgo(n.createdAt)}
                  </span>
                </div>
                {n.body && (
                  <p className="mt-1 text-sm text-ink-muted">{n.body}</p>
                )}
                <div className="mt-1.5 flex items-center gap-2">
                  {n.link && (
                    <Link
                      href={n.link}
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {t("notifications.viewDetail", "Lihat detail")}
                    </Link>
                  )}
                  {!n.isRead && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="text-xs text-ink-subtle hover:text-ink"
                    >
                      {t("notifications.markRead", "Tandai dibaca")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes}m lalu`;
  if (hours < 24) return `${hours}j lalu`;
  if (days < 7) return `${days}h lalu`;
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}
