"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import {
  ClipboardList,
  Plus,
  Trash2,
  Pencil,
  ArrowUp,
  ArrowDown,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const CONTRIBUTION_TYPES = [
  { value: "monitoring", label: "Monitoring" },
  { value: "restoration", label: "Restorasi" },
  { value: "trench", label: "Pengembangan Parit" },
  { value: "tree_planting", label: "Penanaman Pohon" },
  { value: "seedling_stock", label: "Stok Bibit" },
];

const FIELD_TYPES = [
  { value: "text", label: "Teks Pendek" },
  { value: "longtext", label: "Teks Panjang" },
  { value: "number", label: "Angka" },
  { value: "date", label: "Tanggal" },
  { value: "phone", label: "Nomor Telepon" },
  { value: "select", label: "Pilih Satu" },
  { value: "multiselect", label: "Pilih Banyak" },
  { value: "photo", label: "Foto" },
  { value: "location", label: "Lokasi" },
  { value: "link", label: "Link / URL" },
  { value: "province", label: "Provinsi" },
];

type FormField = {
  id: string;
  fieldId: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string;
  helpText: string;
  options: string;
  sortOrder: number;
};

type FormData = {
  id: string;
  slug: string;
  title: string;
  description: string;
  pointsOnSubmit: number;
  contributionType: string;
  isActive: boolean;
  sortOrder: number;
  fields: FormField[];
};

type NewField = {
  fieldId: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string;
  helpText: string;
  options: string;
};

async function csrfHeaders(): Promise<Record<string, string>> {
  try {
    const { token } = await fetch("/api/csrf").then(r => r.json());
    return { "Content-Type": "application/json", "x-csrf-token": token };
  } catch {
    return { "Content-Type": "application/json" };
  }
}

export default function AdminEditFormPage() {
  const params = useParams();
  const formId = params.id as string;
  const [activeTab, setActiveTab] = useState<"metadata" | "fields">("metadata");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [meta, setMeta] = useState({
    title: "",
    description: "",
    pointsOnSubmit: 25,
    contributionType: "monitoring",
    sortOrder: 0,
  });
  const [fields, setFields] = useState<FormField[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [newField, setNewField] = useState<NewField>({
    fieldId: "",
    label: "",
    type: "text",
    required: false,
    placeholder: "",
    helpText: "",
    options: "",
  });
  const [addingField, setAddingField] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    fetchForm();
  }, [formId]); // eslint-disable-line react-hooks/exhaustive-deps

  function fetchForm() {
    setLoading(true);
    setError("");
    fetch(`/api/admin/forms/${formId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        const f = data.form as FormData;
        setMeta({
          title: f.title,
          description: f.description || "",
          pointsOnSubmit: f.pointsOnSubmit,
          contributionType: f.contributionType,
          sortOrder: f.sortOrder,
        });
        const parsed = f.fields.map((field) => ({
          ...field,
          options: typeof field.options === "string" ? field.options : JSON.stringify(field.options),
        }));
        setFields(parsed);
      })
      .catch(() => setError(t("admin.formBuilder.failedLoadForm")))
      .finally(() => setLoading(false));
  }

  function updateMeta(field: string, value: string | number) {
    setMeta((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSaveMeta() {
    setError("");
    setSuccess("");
    if (!meta.title.trim()) {
      setError(t("admin.formBuilder.titleRequired"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/forms/${formId}`, {
        method: "PUT",
        headers: await csrfHeaders(),
        body: JSON.stringify(meta),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(t("admin.formBuilder.updateSuccess"));
      } else {
        setError(data.error || t("admin.formBuilder.failedSaveForm"));
      }
    } catch {
      setError(t("admin.formBuilder.networkError"));
    } finally {
      setSaving(false);
    }
  }

  function generateFieldId(label: string) {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  }

  function handleNewFieldLabel(value: string) {
    setNewField((prev) => ({
      ...prev,
      label: value,
      fieldId: generateFieldId(value),
    }));
  }

  async function handleAddField() {
    setError("");
    setSuccess("");
    if (!newField.label.trim()) {
      setError(t("admin.formBuilder.fieldLabelRequired"));
      return;
    }
    const finalFieldId = newField.fieldId || generateFieldId(newField.label);
    setAddingField(true);
    try {
      const res = await fetch(`/api/admin/forms/${formId}/fields`, {
        method: "POST",
        headers: await csrfHeaders(),
        body: JSON.stringify({
          ...newField,
          fieldId: finalFieldId,
          options: (newField.type === "select" || newField.type === "multiselect")
            ? newField.options.split("\n").map((o) => o.trim()).filter((o) => o)
            : [],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(t("admin.formBuilder.fieldAddSuccess"));
        setNewField({
          fieldId: "",
          label: "",
          type: "text",
          required: false,
          placeholder: "",
          helpText: "",
          options: "",
        });
        fetchForm();
      } else {
        setError(data.error || t("admin.formBuilder.failedAddField"));
      }
    } catch {
      setError(t("admin.formBuilder.networkError"));
    } finally {
      setAddingField(false);
    }
  }

  async function handleDeleteField(fieldId: string, label: string) {
    if (!confirm(t("admin.formBuilder.confirmDeleteField", { label }))) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/forms/${formId}/fields/${fieldId}`, {
        method: "DELETE",
        headers: await csrfHeaders(),
      });
      if (res.ok) {
        setSuccess(t("admin.formBuilder.fieldDeleteSuccess"));
        fetchForm();
      } else {
        const data = await res.json();
        setError(data.error || t("admin.formBuilder.failedDeleteField"));
      }
    } catch {
      setError(t("admin.formBuilder.networkError"));
    }
  }

  async function handleToggleRequired(field: FormField) {
    try {
      await fetch(`/api/admin/forms/${formId}/fields/${field.fieldId}`, {
        method: "PUT",
        headers: await csrfHeaders(),
        body: JSON.stringify({ required: !field.required }),
      });
      fetchForm();
    } catch {
      setError(t("admin.formBuilder.failedToggleRequired"));
    }
  }

  async function handleMoveField(field: FormField, direction: "up" | "down") {
    const idx = fields.findIndex((f) => f.id === field.id);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === fields.length - 1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const swapField = fields[swapIdx];
    try {
      await fetch(`/api/admin/forms/${formId}/fields/${field.fieldId}`, {
        method: "PUT",
        headers: await csrfHeaders(),
        body: JSON.stringify({ sortOrder: swapField.sortOrder }),
      });
      await fetch(`/api/admin/forms/${formId}/fields/${swapField.fieldId}`, {
        method: "PUT",
        headers: await csrfHeaders(),
        body: JSON.stringify({ sortOrder: field.sortOrder }),
      });
      fetchForm();
    } catch {
      setError(t("admin.formBuilder.failedReorder"));
    }
  }

  // ── Inline edit field form ──
  function EditFieldForm({ field, formId, onClose, onSaved, onError }: {
    field: FormField;
    formId: string;
    onClose: () => void;
    onSaved: () => void;
    onError: (msg: string) => void;
  }) {
    const [label, setLabel] = useState(field.label);
    const [type, setType] = useState(field.type);
    const [placeholder, setPlaceholder] = useState(field.placeholder || "");
    const [helpText, setHelpText] = useState(field.helpText || "");
    const [optionsText, setOptionsText] = useState(() => {
      try {
        const parsed = JSON.parse(field.options || "[]");
        return Array.isArray(parsed) ? parsed.join("\n") : "";
      } catch { return field.options || ""; }
    });
    const [saving, setSaving] = useState(false);

    async function handleSave() {
      onError("");
      if (!label.trim()) { onError(t("admin.formBuilder.labelRequired")); return; }
      setSaving(true);
      try {
        const body: Record<string, unknown> = {
          label: label.trim(),
          type,
          placeholder: placeholder.trim(),
          helpText: helpText.trim(),
        };
        if (type === "select" || type === "multiselect") {
          body.options = optionsText.split(/\r?\n/).map((o) => o.trim()).filter((o) => o);
        }
        const res = await fetch(`/api/admin/forms/${formId}/fields/${field.fieldId}`, {
          method: "PUT",
          headers: await csrfHeaders(),
          body: JSON.stringify(body),
        });
        if (res.ok) onSaved();
        else { const d = await res.json(); onError(d.error || t("admin.formBuilder.failedSave")); }
      } catch { onError(t("admin.formBuilder.networkError")); }
      finally { setSaving(false); }
    }

    return (
      <div className="border-t border-ink-line bg-slate-50 px-6 py-4 dark:bg-slate-800/50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-ink">{t("admin.formBuilder.editFieldTitle", { fieldId: field.fieldId })}</span>
          <button onClick={onClose} className="rounded p-1 text-ink-muted hover:bg-slate-200"><X className="h-3.5 w-3.5" /></button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-ink-muted">{t("admin.formBuilder.fieldLabel")}</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)}
              className="w-full rounded border border-ink-line px-2 py-1.5 text-xs focus:border-brand-500 focus:outline-none dark:bg-slate-800 dark:text-white dark:border-slate-600" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-ink-muted">{t("admin.formBuilder.fieldType")}</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full rounded border border-ink-line px-2 py-1.5 text-xs focus:border-brand-500 focus:outline-none dark:bg-slate-800 dark:text-white dark:border-slate-600">
              {FIELD_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-ink-muted">{t("admin.formBuilder.fieldPlaceholder")}</label>
            <input type="text" value={placeholder} onChange={e => setPlaceholder(e.target.value)}
              className="w-full rounded border border-ink-line px-2 py-1.5 text-xs focus:border-brand-500 focus:outline-none dark:bg-slate-800 dark:text-white dark:border-slate-600" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-ink-muted">{t("admin.formBuilder.fieldHelpText")}</label>
            <input type="text" value={helpText} onChange={e => setHelpText(e.target.value)}
              className="w-full rounded border border-ink-line px-2 py-1.5 text-xs focus:border-brand-500 focus:outline-none dark:bg-slate-800 dark:text-white dark:border-slate-600" />
          </div>
        </div>
        {(type === "select" || type === "multiselect") && (
          <div className="mt-3 space-y-1">
            <label className="text-[10px] font-medium text-ink-muted">{t("admin.formBuilder.optionsOnePerLine")}</label>
            <textarea value={optionsText} onChange={e => setOptionsText(e.target.value)} rows={3}
              className="w-full rounded border border-ink-line px-2 py-1.5 text-xs focus:border-brand-500 focus:outline-none dark:bg-slate-800 dark:text-white dark:border-slate-600" />
          </div>
        )}
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-ink-line px-3 py-1 text-xs font-medium text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-700">{t("common.cancel")}</button>
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            {t("common.save")}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/forms"
          className="rounded-md p-1.5 text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-ink"
        >
          <ArrowUp className="h-5 w-5 rotate-[-90deg]" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-ink">{t("admin.formBuilder.editForm")}</h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            {meta.title || t("admin.formBuilder.loading")}
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

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-ink-line p-1">
        <button
          onClick={() => setActiveTab("metadata")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
            activeTab === "metadata"
              ? "bg-brand-600 text-white"
              : "text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-700"
          }`}
        >
          {t("admin.formBuilder.metadataTab")}
        </button>
        <button
          onClick={() => setActiveTab("fields")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
            activeTab === "fields"
              ? "bg-brand-600 text-white"
              : "text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-700"
          }`}
        >
          {t("admin.formBuilder.fieldBuilderTab", { count: String(fields.length) })}
        </button>
      </div>

      {activeTab === "metadata" && (
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-brand-600" />
            <h3 className="text-sm font-semibold text-ink">{t("admin.formBuilder.formInformation")}</h3>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-muted">
              {t("admin.formBuilder.formTitle")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={meta.title}
              onChange={(e) => updateMeta("title", e.target.value)}
              className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-800 dark:text-white dark:border-slate-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-muted">
              {t("admin.formBuilder.formDescription")}
            </label>
            <textarea
              value={meta.description}
              onChange={(e) => updateMeta("description", e.target.value)}
              rows={3}
              className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-800 dark:text-white dark:border-slate-600"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">
                {t("admin.formBuilder.pointsPerSubmit")}
              </label>
              <input
                type="number"
                value={meta.pointsOnSubmit}
                onChange={(e) =>
                  updateMeta("pointsOnSubmit", parseInt(e.target.value) || 0)
                }
                min={0}
                className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-800 dark:text-white dark:border-slate-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">
                {t("admin.formBuilder.contributionType")}
              </label>
              <select
                value={meta.contributionType}
                onChange={(e) => updateMeta("contributionType", e.target.value)}
                className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-800 dark:text-white dark:border-slate-600"
              >
                {CONTRIBUTION_TYPES.map((ct) => (
                  <option key={ct.value} value={ct.value}>
                    {ct.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">
                {t("admin.formBuilder.sortOrder")}
              </label>
              <input
                type="number"
                value={meta.sortOrder}
                onChange={(e) =>
                  updateMeta("sortOrder", parseInt(e.target.value) || 0)
                }
                min={0}
                className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-800 dark:text-white dark:border-slate-600"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveMeta}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("admin.formBuilder.saving")}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {t("admin.formBuilder.saveMetadata")}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {activeTab === "fields" && (
        <div className="space-y-6">
          {/* Existing Fields */}
          {fields.length === 0 ? (
            <div className="card py-12 text-center">
              <ClipboardList className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm text-ink-muted">
                {t("admin.formBuilder.noFields")}
              </p>
            </div>
          ) : (
            <div className="card divide-y divide-ink-line">
              <div className="flex items-center justify-between px-4 py-3">
                <h3 className="text-sm font-semibold text-ink">
                  {t("admin.formBuilder.fieldsCount", { count: String(fields.length) })}
                </h3>
              </div>
              {fields.map((field) => (
                <React.Fragment key={field.id}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Move buttons */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleMoveField(field, "up")}
                        className="rounded p-0.5 text-ink-subtle hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-ink"
                        title={t("admin.formBuilder.moveUp")}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleMoveField(field, "down")}
                        className="rounded p-0.5 text-ink-subtle hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-ink"
                        title={t("admin.formBuilder.moveDown")}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Field info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ink">
                          {field.label}
                        </span>
                        {field.required && (
                          <span className="text-xs text-red-500">*</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-ink-muted">
                        <span className="font-mono">{field.fieldId}</span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 capitalize text-slate-600">
                          {field.type}
                        </span>
                        {field.placeholder && (
                          <span className="text-ink-subtle">
                            placeholder: &quot;{field.placeholder}&quot;
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <label className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-700">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={() => handleToggleRequired(field)}
                          className="h-3.5 w-3.5 rounded border-ink-line text-brand-600 focus:ring-brand-500"
                        />
                        {t("admin.formBuilder.required")}
                      </label>
                      <button
                        onClick={() =>
                          setEditingField(
                            editingField === field.fieldId ? null : field.fieldId
                          )
                        }
                        className="rounded-md p-1.5 text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-brand-600"
                        title={t("common.edit")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteField(field.fieldId, field.label)}
                        className="rounded-md p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600"
                        title={t("common.delete")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {editingField === field.fieldId && (
                    <EditFieldForm
                      field={field}
                      formId={formId}
                      onClose={() => setEditingField(null)}
                      onSaved={() => { setEditingField(null); fetchForm(); }}
                      onError={(msg) => setError(msg)}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Add Field */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-brand-600" />
              <h3 className="text-sm font-semibold text-ink">
                {t("admin.formBuilder.addNewField")}
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink-muted">
                  {t("admin.formBuilder.fieldLabel")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newField.label}
                  onChange={(e) => handleNewFieldLabel(e.target.value)}
                  placeholder={t("admin.formBuilder.placeholderSpringName")}
                  className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-800 dark:text-white dark:border-slate-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink-muted">
                  {t("admin.formBuilder.fieldId")}
                </label>
                <input
                  type="text"
                  value={newField.fieldId}
                  onChange={(e) =>
                    setNewField((prev) => ({
                      ...prev,
                      fieldId: e.target.value,
                    }))
                  }
                  placeholder={t("admin.formBuilder.placeholderFieldId")}
                  className="w-full rounded-md border border-ink-line px-3 py-2 text-sm font-mono focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">
                {t("admin.formBuilder.fieldType")}
              </label>
              <div className="flex flex-wrap gap-1">
                {FIELD_TYPES.map(ft => (
                  <button key={ft.value} type="button"
                    onClick={() => setNewField((prev) => ({ ...prev, type: ft.value }))}
                    className={`rounded-md border px-2 py-1 text-[11px] font-medium transition ${
                      newField.type === ft.value
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-ink-line text-ink-muted hover:bg-brand-50 hover:text-brand-700"
                    }`}>
                    {ft.label}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-ink-line px-3 py-2 text-sm text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-700">
                  <input
                    type="checkbox"
                    checked={newField.required}
                    onChange={(e) =>
                      setNewField((prev) => ({
                        ...prev,
                        required: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-ink-line text-brand-600 focus:ring-brand-500"
                  />
                  {t("admin.formBuilder.requiredLabel")}
                </label>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink-muted">
                  {t("admin.formBuilder.fieldPlaceholder")}
                </label>
                <input
                  type="text"
                  value={newField.placeholder}
                  onChange={(e) =>
                    setNewField((prev) => ({
                      ...prev,
                      placeholder: e.target.value,
                    }))
                  }
                  placeholder={t("admin.formBuilder.placeholderPlaceholder")}
                  className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-800 dark:text-white dark:border-slate-600"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink-muted">
                  {t("admin.formBuilder.fieldHelpText")}
                </label>
                <input
                  type="text"
                  value={newField.helpText}
                  onChange={(e) =>
                    setNewField((prev) => ({
                      ...prev,
                      helpText: e.target.value,
                    }))
                  }
                  placeholder={t("admin.formBuilder.placeholderHelpText")}
                  className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-800 dark:text-white dark:border-slate-600"
                />
              </div>
            </div>

            {(newField.type === "select" ||
              newField.type === "multiselect") && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink-muted">
                  {t("admin.formBuilder.optionsOnePerLine")}
                </label>
                <textarea
                  value={newField.options}
                  onChange={(e) =>
                    setNewField((prev) => ({
                      ...prev,
                      options: e.target.value,
                    }))
                  }
                  placeholder={t("admin.formBuilder.placeholderOptions")}
                  rows={4}
                  className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-slate-800 dark:text-white dark:border-slate-600"
                />
                <p className="text-[10px] text-ink-subtle">
                  {t("admin.formBuilder.optionsHint")}
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleAddField}
                disabled={addingField}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {addingField ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("admin.formBuilder.addingField")}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    {t("admin.formBuilder.addField")}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
