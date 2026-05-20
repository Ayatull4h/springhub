"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
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

export default function AdminEditFormPage() {
  const router = useRouter();
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

  useEffect(() => {
    fetchForm();
  }, [formId]);

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
      .catch(() => setError("Gagal memuat form"))
      .finally(() => setLoading(false));
  }

  function updateMeta(field: string, value: string | number) {
    setMeta((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSaveMeta() {
    setError("");
    setSuccess("");
    if (!meta.title.trim()) {
      setError("Judul wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/forms/${formId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meta),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Form berhasil diperbarui");
      } else {
        setError(data.error || "Gagal menyimpan form");
      }
    } catch {
      setError("Kesalahan jaringan");
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
      setError("Label field wajib diisi");
      return;
    }
    const finalFieldId = newField.fieldId || generateFieldId(newField.label);
    setAddingField(true);
    try {
      const res = await fetch(`/api/admin/forms/${formId}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newField,
          fieldId: finalFieldId,
          options: (newField.type === "select" || newField.type === "multiselect")
            ? newField.options.split("\n").filter((o) => o.trim())
            : [],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Field berhasil ditambahkan");
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
        setError(data.error || "Gagal menambah field");
      }
    } catch {
      setError("Kesalahan jaringan");
    } finally {
      setAddingField(false);
    }
  }

  async function handleDeleteField(fieldId: string, label: string) {
    if (!confirm(`Hapus field "${label}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/forms/${formId}/fields/${fieldId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSuccess("Field berhasil dihapus");
        fetchForm();
      } else {
        const data = await res.json();
        setError(data.error || "Gagal menghapus field");
      }
    } catch {
      setError("Kesalahan jaringan");
    }
  }

  async function handleToggleRequired(field: FormField) {
    try {
      await fetch(`/api/admin/forms/${formId}/fields/${field.fieldId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ required: !field.required }),
      });
      fetchForm();
    } catch {
      setError("Gagal mengubah required");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: swapField.sortOrder }),
      });
      await fetch(`/api/admin/forms/${formId}/fields/${swapField.fieldId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: field.sortOrder }),
      });
      fetchForm();
    } catch {
      setError("Gagal mengubah urutan");
    }
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
          className="rounded-md p-1.5 text-ink-muted hover:bg-slate-100 hover:text-ink"
        >
          <ArrowUp className="h-5 w-5 rotate-[-90deg]" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-ink">Edit Form</h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            {meta.title || "Memuat..."}
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

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-ink-line p-1">
        <button
          onClick={() => setActiveTab("metadata")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
            activeTab === "metadata"
              ? "bg-brand-600 text-white"
              : "text-ink-muted hover:bg-slate-100"
          }`}
        >
          Metadata Form
        </button>
        <button
          onClick={() => setActiveTab("fields")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
            activeTab === "fields"
              ? "bg-brand-600 text-white"
              : "text-ink-muted hover:bg-slate-100"
          }`}
        >
          Field Builder ({fields.length})
        </button>
      </div>

      {activeTab === "metadata" && (
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-brand-600" />
            <h3 className="text-sm font-semibold text-ink">Informasi Form</h3>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-muted">
              Judul <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={meta.title}
              onChange={(e) => updateMeta("title", e.target.value)}
              className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-ink-muted">
              Deskripsi
            </label>
            <textarea
              value={meta.description}
              onChange={(e) => updateMeta("description", e.target.value)}
              rows={3}
              className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">
                Poin per Submit
              </label>
              <input
                type="number"
                value={meta.pointsOnSubmit}
                onChange={(e) =>
                  updateMeta("pointsOnSubmit", parseInt(e.target.value) || 0)
                }
                min={0}
                className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted">
                Tipe Kontribusi
              </label>
              <select
                value={meta.contributionType}
                onChange={(e) => updateMeta("contributionType", e.target.value)}
                className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
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
                Urutan
              </label>
              <input
                type="number"
                value={meta.sortOrder}
                onChange={(e) =>
                  updateMeta("sortOrder", parseInt(e.target.value) || 0)
                }
                min={0}
                className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
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
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Simpan Metadata
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
                Belum ada field. Tambahkan field pertama.
              </p>
            </div>
          ) : (
            <div className="card divide-y divide-ink-line">
              <div className="flex items-center justify-between px-4 py-3">
                <h3 className="text-sm font-semibold text-ink">
                  Field ({fields.length})
                </h3>
              </div>
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  {/* Move buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => handleMoveField(field, "up")}
                      className="rounded p-0.5 text-ink-subtle hover:bg-slate-100 hover:text-ink"
                      title="Naik"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleMoveField(field, "down")}
                      className="rounded p-0.5 text-ink-subtle hover:bg-slate-100 hover:text-ink"
                      title="Turun"
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
                    <label className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs text-ink-muted hover:bg-slate-100">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={() => handleToggleRequired(field)}
                        className="h-3.5 w-3.5 rounded border-ink-line text-brand-600 focus:ring-brand-500"
                      />
                      Required
                    </label>
                    <button
                      onClick={() =>
                        setEditingField(
                          editingField === field.fieldId ? null : field.fieldId
                        )
                      }
                      className="rounded-md p-1.5 text-ink-muted hover:bg-slate-100 hover:text-brand-600"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteField(field.fieldId, field.label)}
                      className="rounded-md p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600"
                      title="Hapus"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Field */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-brand-600" />
              <h3 className="text-sm font-semibold text-ink">
                Tambah Field Baru
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink-muted">
                  Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newField.label}
                  onChange={(e) => handleNewFieldLabel(e.target.value)}
                  placeholder="Nama Mata Air"
                  className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink-muted">
                  Field ID
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
                  placeholder="nama_mata_air"
                  className="w-full rounded-md border border-ink-line px-3 py-2 text-sm font-mono focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink-muted">
                  Tipe Field
                </label>
                <select
                  value={newField.type}
                  onChange={(e) =>
                    setNewField((prev) => ({
                      ...prev,
                      type: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                >
                  {FIELD_TYPES.map((ft) => (
                    <option key={ft.value} value={ft.value}>
                      {ft.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-ink-line px-3 py-2 text-sm text-ink-muted hover:bg-slate-100">
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
                  Required (wajib diisi)
                </label>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink-muted">
                  Placeholder
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
                  placeholder="Masukkan nama mata air"
                  className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink-muted">
                  Teks Bantuan
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
                  placeholder="Petunjuk untuk relawan"
                  className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            </div>

            {(newField.type === "select" ||
              newField.type === "multiselect") && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink-muted">
                  Opsi (satu per baris)
                </label>
                <textarea
                  value={newField.options}
                  onChange={(e) =>
                    setNewField((prev) => ({
                      ...prev,
                      options: e.target.value,
                    }))
                  }
                  placeholder={`Pilihan 1\nPilihan 2\nPilihan 3`}
                  rows={4}
                  className="w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
                <p className="text-[10px] text-ink-subtle">
                  Tulis setiap opsi pada baris terpisah
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
                    Menambahkan...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Tambah Field
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
