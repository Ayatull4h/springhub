"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Layers,
  AlertCircle,
} from "lucide-react";

type FormField = {
  id: string;
  fieldId: string;
  label: string;
  type: string;
  sortOrder: number;
};

type FormItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  pointsOnSubmit: number;
  contributionType: string;
  isActive: boolean;
  sortOrder: number;
  fields: FormField[];
  _count: { reports: number };
  createdAt: string;
};

export default function AdminFormsPage() {
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchForms = () => {
    setLoading(true);
    fetch("/api/admin/forms")
      .then((r) => r.json())
      .then((data) => setForms(data.forms ?? []))
      .catch(() => setError("Failed to load forms"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchForms();
  }, []);

  async function handleDelete(id: string, title: string) {
    const hasReports = forms.find((f) => f.id === id)?._count?.reports ?? 0;
    const msg = hasReports > 0
      ? `Form "${title}" memiliki ${hasReports} laporan. Form akan dinonaktifkan (bukan dihapus). Lanjutkan?`
      : `Hapus form "${title}"? Tindakan ini tidak bisa dibatalkan.`;
    if (!confirm(msg)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/forms/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        if (data.softDelete) {
          // Soft-delete: form dinonaktifkan, jangan hapus dari state
          alert(data.message);
          setForms((prev) =>
            prev.map((f) => (f.id === id ? { ...f, isActive: false } : f))
          );
        } else {
          // Hard-delete: form benar-benar dihapus
          setForms((prev) => prev.filter((f) => f.id !== id));
        }
      } else {
        alert(data.error || "Gagal menghapus");
      }
    } catch {
      alert("Gagal menghapus form");
    } finally {
      setDeleting(null);
    }
  }

  async function handleToggleActive(form: FormItem) {
    setToggling(form.id);
    try {
      const res = await fetch(`/api/admin/forms/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !form.isActive }),
      });
      if (res.ok) {
        setForms((prev) =>
          prev.map((f) =>
            f.id === form.id ? { ...f, isActive: !f.isActive } : f
          )
        );
      } else {
        const data = await res.json();
        alert(data.error || "Failed to toggle status");
      }
    } catch {
      alert("Failed to toggle form status");
    } finally {
      setToggling(null);
    }
  }

  const filtered =
    filter === "all"
      ? forms
      : filter === "active"
        ? forms.filter((f) => f.isActive)
        : forms.filter((f) => !f.isActive);

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
          <h2 className="text-xl font-bold text-ink">Forms</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {forms.length} form{forms.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/admin/forms/new"
          className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Create New Form
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "active", "inactive"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              filter === f
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-ink-muted hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card py-12 text-center">
          <ClipboardList className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm text-ink-muted">No forms found</p>
          {filter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              className="mt-2 text-xs text-brand-600 hover:underline"
            >
              Show all forms
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((form) => (
            <div key={form.id} className="card flex flex-col">
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    form.isActive
                      ? "bg-brand-50 text-brand-600"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1">
                  {!form.isActive && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      Inactive
                    </span>
                  )}
                  <button
                    onClick={() => handleToggleActive(form)}
                    disabled={toggling === form.id}
                    className="rounded-md p-1.5 text-ink-muted hover:bg-slate-100 hover:text-ink disabled:opacity-50"
                    title={form.isActive ? "Deactivate" : "Activate"}
                  >
                    {form.isActive ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <Link
                    href={`/admin/forms/${form.id}`}
                    className="rounded-md p-1.5 text-ink-muted hover:bg-slate-100 hover:text-ink"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(form.id, form.title)}
                    disabled={deleting === form.id}
                    className="rounded-md p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="mt-3 text-sm font-semibold text-ink">
                {form.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
                {form.description || "No description"}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                <span className="rounded-md bg-brand-50 px-2 py-0.5 text-brand-700">
                  +{form.pointsOnSubmit} pts
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 capitalize text-slate-600">
                  {form.contributionType}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  {form.fields.length} field
                  {form.fields.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-ink-line pt-3">
                <span className="text-xs text-ink-subtle">
                  {form._count.reports} report
                  {form._count.reports !== 1 ? "s" : ""}
                </span>
                <span className="font-mono text-[10px] text-ink-subtle">
                  {form.slug}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
