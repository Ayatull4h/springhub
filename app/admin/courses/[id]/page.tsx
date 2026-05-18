"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  BookOpen,
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import Link from "next/link";

type ModuleForm = {
  title: string;
  content: string;
};

type CourseData = {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  modules: ModuleForm[];
};

export default function AdminEditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    slug: "",
    title: "",
    description: "",
    level: "Beginner",
    duration: "30 min",
    icon: "BookOpen",
    isActive: true,
    sortOrder: 0,
  });
  const [modules, setModules] = useState<ModuleForm[]>([]);

  useEffect(() => {
    fetch(`/api/admin/courses/${courseId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        const c = data.course;
        setForm({
          slug: c.slug,
          title: c.title,
          description: c.description || "",
          level: c.level,
          duration: c.duration,
          icon: c.icon,
          isActive: c.isActive,
          sortOrder: c.sortOrder,
        });
        setModules(
          c.modules?.map((m: any) => ({
            title: m.title,
            content: m.content || "",
          })) || []
        );
      })
      .catch(() => setError("Failed to load course"))
      .finally(() => setLoading(false));
  }, [courseId]);

  function updateForm(field: string, value: string | boolean | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateModule(index: number, field: keyof ModuleForm, value: string) {
    setModules((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addModule() {
    setModules((prev) => [...prev, { title: "", content: "" }]);
  }

  function removeModule(index: number) {
    if (modules.length <= 1) return;
    setModules((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          modules: modules.filter((m) => m.title.trim()),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess("Course updated successfully!");
        setTimeout(() => router.push("/admin/courses"), 1500);
      } else {
        setError(data.error || "Failed to update course");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/courses"
          className="rounded-md p-1.5 text-ink-muted hover:bg-slate-100 hover:text-ink"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-ink">Edit Course</h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            Update course details and modules
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-ink">Basic Information</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">
                Slug
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => updateForm("slug", e.target.value)}
                className="w-full rounded-md border border-ink-line px-3 py-2 text-sm font-mono focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-muted">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              rows={3}
              className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">
                Level
              </label>
              <select
                value={form.level}
                onChange={(e) => updateForm("level", e.target.value)}
                className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">
                Duration
              </label>
              <input
                type="text"
                value={form.duration}
                onChange={(e) => updateForm("duration", e.target.value)}
                className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">
                Icon
              </label>
              <select
                value={form.icon}
                onChange={(e) => updateForm("icon", e.target.value)}
                className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value="BookOpen">BookOpen</option>
                <option value="TreePine">TreePine</option>
                <option value="Droplets">Droplets</option>
                <option value="Map">Map</option>
                <option value="GraduationCap">GraduationCap</option>
                <option value="Globe">Globe</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">
                Sort Order
              </label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  updateForm("sortOrder", parseInt(e.target.value) || 0)
                }
                className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3 rounded-lg border border-ink-line p-3">
            <button
              type="button"
              onClick={() => updateForm("isActive", !form.isActive)}
              className={`rounded-md p-1 ${
                form.isActive ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              {form.isActive ? (
                <ToggleRight className="h-6 w-6" />
              ) : (
                <ToggleLeft className="h-6 w-6" />
              )}
            </button>
            <div>
              <div className="text-sm font-medium text-ink">
                {form.isActive ? "Active" : "Inactive"}
              </div>
              <div className="text-xs text-ink-muted">
                {form.isActive
                  ? "Course is visible to users"
                  : "Course is hidden from users"}
              </div>
            </div>
          </div>
        </div>

        {/* Modules */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">
              Modules ({modules.length})
            </h3>
            <button
              type="button"
              onClick={addModule}
              className="inline-flex items-center gap-1 rounded-md border border-ink-line px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-slate-100"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Module
            </button>
          </div>

          <div className="space-y-3">
            {modules.map((mod, index) => (
              <div
                key={index}
                className="rounded-lg border border-ink-line bg-slate-50 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-ink-muted">
                    Module {index + 1}
                  </span>
                  {modules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeModule(index)}
                      className="rounded-md p-1 text-ink-muted hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="mt-2 space-y-2">
                  <input
                    type="text"
                    value={mod.title}
                    onChange={(e) =>
                      updateModule(index, "title", e.target.value)
                    }
                    placeholder="Module title"
                    className="w-full rounded-md border border-ink-line px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                  <textarea
                    value={mod.content}
                    onChange={(e) =>
                      updateModule(index, "content", e.target.value)
                    }
                    placeholder="Module content (HTML or markdown supported)"
                    rows={4}
                    className="w-full rounded-md border border-ink-line px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/courses"
            className="rounded-md border border-ink-line px-4 py-2 text-sm font-medium text-ink-muted hover:bg-slate-100"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Update Course
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
