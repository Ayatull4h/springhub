"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import {
  BookOpen,
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

type ModuleForm = {
  title: string;
  content: string;
};

export default function AdminNewCoursePage() {
  const router = useRouter();
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
  });
  const { t } = useI18n();
  const [modules, setModules] = useState<ModuleForm[]>([
    { title: "", content: "" },
  ]);

  function updateForm(field: string, value: string) {
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

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate
    if (!form.title.trim()) {
      setError(t("admin.courseEditor.titleRequired"));
      return;
    }
    const slug = form.slug || generateSlug(form.title);
    if (!slug) {
      setError(t("admin.courseEditor.slugRequired"));
      return;
    }

    const validModules = modules.filter((m) => m.title.trim());
    if (validModules.length === 0) {
      setError(t("admin.courseEditor.moduleRequired"));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          slug,
          modules: validModules,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(t("admin.courseEditor.createSuccess", { title: data.course.title }));
        setTimeout(() => router.push("/admin/courses"), 1500);
      } else {
        setError(data.error || t("admin.courseEditor.failedCreate"));
      }
    } catch {
      setError(t("admin.courseEditor.networkError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/courses"
          className="rounded-md p-1.5 text-ink-muted hover:bg-slate-100 hover:text-ink dark:hover:bg-slate-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-ink">{t("admin.courseEditor.newCourse")}</h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            {t("admin.courseEditor.newCourseDesc")}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-ink">{t("admin.courseEditor.basicInfo")}</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">
                {t("admin.courseEditor.title")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => {
                  updateForm("title", e.target.value);
                  if (!form.slug) {
                    updateForm("slug", generateSlug(e.target.value));
                  }
                }}
                placeholder={t("admin.courseEditor.placeholderTitle")}
                className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">
                {t("admin.courseEditor.slug")}
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => updateForm("slug", e.target.value)}
                placeholder={t("admin.courseEditor.placeholderSlug")}
                className="w-full rounded-md border border-ink-line px-3 py-2 text-sm font-mono focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-muted">
              {t("admin.courseEditor.description")}
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              placeholder={t("admin.courseEditor.placeholderDescription")}
              rows={3}
              className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">
                {t("admin.courseEditor.level")}
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
                {t("admin.courseEditor.duration")}
              </label>
              <input
                type="text"
                value={form.duration}
                onChange={(e) => updateForm("duration", e.target.value)}
                placeholder={t("admin.courseEditor.placeholderDuration")}
                className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">
                {t("admin.courseEditor.icon")}
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
          </div>
        </div>

        {/* Modules */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">
              {t("admin.courseEditor.modules", { count: String(modules.length) })}
            </h3>
            <button
              type="button"
              onClick={addModule}
              className="inline-flex items-center gap-1 rounded-md border border-ink-line px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-slate-100"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("admin.courseEditor.addModule")}
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
                    {t("admin.courseEditor.moduleNumber", { number: String(index + 1) })}
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
                    placeholder={t("admin.courseEditor.moduleTitlePlaceholder")}
                    className="w-full rounded-md border border-ink-line px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                  <textarea
                    value={mod.content}
                    onChange={(e) =>
                      updateModule(index, "content", e.target.value)
                    }
                    placeholder={t("admin.courseEditor.moduleContentPlaceholder")}
                    rows={3}
                    className="w-full rounded-md border border-ink-line px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                  <div>
                    <label className="text-xs text-ink-muted">{t("admin.courseEditor.materialFileLabel")}</label>
                    <input type="file" accept=".pdf" onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) updateModule(index, 'content', file.name);
                    }} className="mt-1 text-xs" />
                  </div>
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
            {t("common.cancel")}
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t("admin.courseEditor.saving")}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {t("admin.courseEditor.saveCourse")}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
