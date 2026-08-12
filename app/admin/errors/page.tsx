"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  Bug,
  Info,
  XCircle,
  ExternalLink,
  Trash2,
  CheckCircle2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type ErrorItem = {
  id: string;
  level: "info" | "warning" | "error" | "critical";
  message: string;
  source: "frontend" | "api" | "worker" | "database";
  stack: string;
  url: string;
  userId: string;
  metadata: string;
  read: boolean;
  createdAt: string;
};

const LEVEL_CONFIG: Record<
  string,
  { label: string; icon: typeof Bug; className: string }
> = {
  critical: {
    label: "Critical",
    icon: XCircle,
    className:
      "text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300",
  },
  error: {
    label: "Error",
    icon: Bug,
    className:
      "text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-300",
  },
  warning: {
    label: "Warning",
    icon: AlertTriangle,
    className:
      "text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300",
  },
  info: {
    label: "Info",
    icon: Info,
    className:
      "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300",
  },
};

const SOURCE_COLORS: Record<string, string> = {
  frontend: "text-sky-600 bg-sky-50 dark:bg-sky-900/30 dark:text-sky-300",
  api: "text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-300",
  worker: "text-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-slate-300",
  database: "text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-300",
};

export default function AdminErrorsPage() {
  const [errors, setErrors] = useState<ErrorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterRead, setFilterRead] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetchErrors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterLevel) params.set("level", filterLevel);
      if (filterSource) params.set("source", filterSource);
      if (filterRead) params.set("read", filterRead);
      params.set("limit", String(limit));
      params.set("offset", String(offset));

      const res = await fetch(`/api/admin/errors?${params}`);
      const data = await res.json();
      setErrors(data.errors ?? []);
      setTotal(data.total ?? 0);
      setUnread(data.unread ?? 0);
    } catch {
      console.error("Gagal load errors");
    } finally {
      setLoading(false);
    }
  }, [filterLevel, filterSource, filterRead, offset]);

  useEffect(() => {
    fetchErrors();
  }, [fetchErrors]);

  async function markRead(id: string, read: boolean) {
    try {
      await fetch(`/api/admin/errors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read }),
      });
      fetchErrors();
    } catch {
      alert("Gagal update status");
    }
  }

  async function deleteError(id: string) {
    if (!confirm("Hapus error ini?")) return;
    try {
      const { token: csrfToken } = await fetch("/api/csrf").then(r => r.json());
      await fetch(`/api/admin/errors/${id}`, { method: "DELETE", headers: { "x-csrf-token": csrfToken } });
      if (selectedId === id) setSelectedId(null);
      fetchErrors();
    } catch {
      alert("Gagal hapus");
    }
  }

  async function deleteReadErrors() {
    if (!confirm(`Hapus semua ${unread} error yang sudah dibaca?`)) return;
    try {
      const { token: csrfToken } = await fetch("/api/csrf").then(r => r.json());
      const res = await fetch("/api/admin/errors", { method: "DELETE", headers: { "x-csrf-token": csrfToken } });
      const data = await res.json();
      alert(`Berhasil hapus ${data.deleted} error`);
      fetchErrors();
    } catch {
      alert("Gagal hapus");
    }
  }

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  const selectedError = errors.find((e) => e.id === selectedId);

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Error Logs
          </h1>
          <p className="text-sm text-ink-muted">
            {total} total · <span className="font-semibold text-red-500">{unread} belum dibaca</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={deleteReadErrors}
            className="btn-ghost text-xs"
            disabled={unread === 0}
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Hapus yg sudah dibaca
          </button>
          <button
            onClick={fetchErrors}
            className="btn-ghost text-xs"
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={filterLevel}
          onChange={(e) => { setFilterLevel(e.target.value); setOffset(0); }}
          className="input-sm rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-navy-800"
        >
          <option value="">Semua level</option>
          <option value="critical">Critical</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <select
          value={filterSource}
          onChange={(e) => { setFilterSource(e.target.value); setOffset(0); }}
          className="input-sm rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-navy-800"
        >
          <option value="">Semua source</option>
          <option value="frontend">Frontend</option>
          <option value="api">API</option>
          <option value="worker">Worker</option>
          <option value="database">Database</option>
        </select>
        <select
          value={filterRead}
          onChange={(e) => { setFilterRead(e.target.value); setOffset(0); }}
          className="input-sm rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-navy-800"
        >
          <option value="">Semua status</option>
          <option value="false">Belum dibaca</option>
          <option value="true">Sudah dibaca</option>
        </select>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        {/* List */}
        <div className="xl:col-span-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            </div>
          ) : errors.length === 0 ? (
            <div className="rounded-xl border border-slate-200 p-12 text-center dark:border-slate-700">
              <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
              <p className="mt-3 font-medium text-ink">Tidak ada error</p>
              <p className="text-sm text-ink-muted">
                Tenang, aplikasi berjalan lancar ✨
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {errors.map((error) => {
                const levelCfg = LEVEL_CONFIG[error.level] || LEVEL_CONFIG.error;
                const LevelIcon = levelCfg.icon;
                return (
                  <button
                    key={error.id}
                    onClick={() => setSelectedId(error.id)}
                    onDoubleClick={() => markRead(error.id, !error.read)}
                    className={`w-full rounded-lg border px-4 py-3 text-left transition-all ${
                      selectedId === error.id
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                        : error.read
                          ? "border-slate-200 bg-white dark:border-slate-700 dark:bg-navy-800"
                          : "border-slate-200 bg-white shadow-sm dark:border-slate-600 dark:bg-navy-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <LevelIcon
                          className={`mt-0.5 h-4 w-4 ${
                            levelCfg.className.split(" ")[0]
                          }`}
                        />
                        <div className="text-left">
                          <p
                            className={`text-sm font-medium ${
                              error.read ? "text-ink-muted" : "text-ink"
                            }`}
                          >
                            {error.message.slice(0, 100)}
                            {error.message.length > 100 ? "..." : ""}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                LEVEL_CONFIG[error.level]?.className || ""
                              }`}
                            >
                              {error.level}
                            </span>
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                SOURCE_COLORS[error.source] || ""
                              }`}
                            >
                              {error.source}
                            </span>
                            <span>
                              {new Date(error.createdAt).toLocaleString("id-ID")}
                            </span>
                          </div>
                        </div>
                      </div>
                      {!error.read && (
                        <span className="mt-1 h-2 w-2 rounded-full bg-red-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="btn-ghost text-sm disabled:opacity-30"
              >
                <ChevronLeft className="h-3 w-3" />
                Prev
              </button>
              <span className="text-sm text-ink-muted">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
                className="btn-ghost text-sm disabled:opacity-30"
              >
                Next
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="xl:col-span-2">
          {selectedError ? (
            <div className="sticky top-20 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-navy-800">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {React.createElement(
                    LEVEL_CONFIG[selectedError.level]?.icon || Bug,
                    {
                      className: `h-5 w-5 ${
                        LEVEL_CONFIG[selectedError.level]?.className.split(" ")[0] || ""
                      }`,
                    }
                  )}
                  <h3 className="font-bold text-ink">Error Detail</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      markRead(selectedError.id, !selectedError.read)
                    }
                    className="btn-ghost p-1"
                    title={selectedError.read ? "Tandai belum dibaca" : "Tandai sudah dibaca"}
                  >
                    <CheckCircle2
                      className={`h-4 w-4 ${
                        selectedError.read ? "text-green-500" : "text-slate-400"
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => deleteError(selectedError.id)}
                    className="btn-ghost p-1 text-red-500"
                    title="Hapus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-ink">Message</span>
                  <p className="mt-0.5 rounded-lg bg-slate-50 p-2 font-mono text-xs dark:bg-navy-900">
                    {selectedError.message}
                  </p>
                </div>

                <div className="flex gap-4">
                  <div>
                    <span className="font-medium text-ink">Level</span>
                    <p
                      className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        LEVEL_CONFIG[selectedError.level]?.className || ""
                      }`}
                    >
                      {selectedError.level}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-ink">Source</span>
                    <p
                      className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        SOURCE_COLORS[selectedError.source] || ""
                      }`}
                    >
                      {selectedError.source}
                    </p>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-ink">Waktu</span>
                  <p className="text-ink-muted">
                    {new Date(selectedError.createdAt).toLocaleString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      timeZoneName: "short",
                    })}
                  </p>
                </div>

                {selectedError.url && (
                  <div>
                    <span className="font-medium text-ink">URL</span>
                    {(() => {
                      const u = selectedError.url || "";
                      const safe = /^https?:\/\//i.test(u) && !/[\u0000-\u001f]/.test(u);
                      return safe ? (
                        <a
                          href={u}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 flex items-center gap-1 break-all text-brand-600 hover:underline"
                        >
                          {u}
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      ) : (
                        <p className="mt-0.5 break-all font-mono text-xs text-ink-muted">{u}</p>
                      );
                    })()}
                  </div>
                )}

                {selectedError.userId && (
                  <div>
                    <span className="font-medium text-ink">User ID</span>
                    <p className="font-mono text-xs text-ink-muted">
                      {selectedError.userId}
                    </p>
                  </div>
                )}

                {selectedError.stack && (
                  <div>
                    <span className="font-medium text-ink">Stack Trace</span>
                    <pre className="mt-0.5 max-h-40 overflow-auto rounded-lg bg-slate-50 p-2 font-mono text-xs leading-relaxed text-ink-muted dark:bg-navy-900">
                      {selectedError.stack}
                    </pre>
                  </div>
                )}

                {selectedError.metadata &&
                  selectedError.metadata !== "{}" && (
                    <div>
                      <span className="font-medium text-ink">Metadata</span>
                      <pre className="mt-0.5 max-h-40 overflow-auto rounded-lg bg-slate-50 p-2 font-mono text-xs leading-relaxed text-ink-muted dark:bg-navy-900">
                        {JSON.stringify(
                          JSON.parse(selectedError.metadata),
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
              <div className="text-center">
                <Bug className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-2 text-sm text-ink-muted">
                  Klik error di samping untuk detail
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


