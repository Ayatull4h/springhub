"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  Eye,
  Wrench,
  TreePine,
  Sprout,
  Flame,
  CalendarCheck,
  ClipboardCheck,
  Camera,
  Compass,
  Award,
  Trophy,
  Crown,
  BookOpen,
  Gem,
  Sparkles,
  X,
  Check,
  GripVertical,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type PointRule = {
  id: string;
  name: string;
  description: string;
  points: number;
  category: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
};

type FormMode = "create" | "edit";

// ─── Icon map ────────────────────────────────────────────────────────────────

const iconOptions: { name: string; icon: LucideIcon }[] = [
  { name: "Star", icon: Star },
  { name: "Eye", icon: Eye },
  { name: "Wrench", icon: Wrench },
  { name: "TreePine", icon: TreePine },
  { name: "Sprout", icon: Sprout },
  { name: "Flame", icon: Flame },
  { name: "CalendarCheck", icon: CalendarCheck },
  { name: "ClipboardCheck", icon: ClipboardCheck },
  { name: "Camera", icon: Camera },
  { name: "Compass", icon: Compass },
  { name: "Award", icon: Award },
  { name: "Trophy", icon: Trophy },
  { name: "Crown", icon: Crown },
  { name: "BookOpen", icon: BookOpen },
  { name: "Gem", icon: Gem },
  { name: "Sparkles", icon: Sparkles },
];

const iconLookup: Record<string, LucideIcon> = Object.fromEntries(
  iconOptions.map((o) => [o.name, o.icon])
);

const categoryConfig: Record<string, { label: string; className: string }> = {
  basic: { label: "Dasar", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  bonus: { label: "Bonus", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  milestone: { label: "Milestone", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
};

// ─── Modal Component ─────────────────────────────────────────────────────────

function RuleFormModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<PointRule>) => Promise<void>;
  initial?: PointRule | null;
}) {
  const mode: FormMode = initial ? "edit" : "create";
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState(25);
  const [category, setCategory] = useState("basic");
  const [icon, setIcon] = useState("Star");
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setDescription(initial.description);
      setPoints(initial.points);
      setCategory(initial.category);
      setIcon(initial.icon);
      setSortOrder(initial.sortOrder);
    } else {
      setName("");
      setDescription("");
      setPoints(25);
      setCategory("basic");
      setIcon("Star");
      setSortOrder(0);
    }
  }, [open, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || points < 1) return;
    setSaving(true);
    await onSave({ name: name.trim(), description: description.trim(), points, category, icon, sortOrder });
    setSaving(false);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink">
            {mode === "create" ? "Tambah Aturan" : "Edit Aturan"}
          </h3>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink">Nama Aturan</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              placeholder="Spring Monitoring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Deskripsi</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              placeholder="Melaporkan kondisi mata air"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink">Poin</label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                min={1}
                required
                className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Urutan</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                min={0}
                className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value="basic">Dasar</option>
                <option value="bonus">Bonus</option>
                <option value="milestone">Milestone</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Ikon</label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {iconOptions.slice(0, 8).map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => setIcon(opt.name)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md border text-sm transition",
                        icon === opt.name
                          ? "border-brand-500 bg-brand-50 text-brand-600"
                          : "border-ink-line text-ink-muted hover:border-ink"
                      )}
                      title={opt.name}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
                <span className="text-xs text-ink-muted self-center ml-1">
                  +{iconOptions.length - 8} more
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-ink-line px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim() || points < 1}
              className="btn-primary"
            >
              {saving ? "Menyimpan..." : mode === "create" ? "Tambah" : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ────────────────────────────────────────────────────

function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  ruleName,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  ruleName: string;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-ink">Hapus Aturan</h3>
        <p className="mt-2 text-sm text-ink-muted">
          Apakah kamu yakin ingin menghapus <strong>{ruleName}</strong>? Tindakan ini tidak bisa dibatalkan.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-ink-line px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminPointsPage() {
  const [rules, setRules] = useState<PointRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PointRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PointRule | null>(null);
  const [actionMsg, setActionMsg] = useState("");

  const fetchRules = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/point-rules")
      .then((r) => r.json())
      .then((data) => setRules(data.rules ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  function showMsg(msg: string) {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(""), 3000);
  }

  async function handleSave(data: Partial<PointRule>) {
    if (editingRule) {
      // Update existing
      const res = await fetch(`/api/admin/point-rules/${editingRule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        showMsg("Aturan berhasil diperbarui!");
        fetchRules();
      } else {
        const err = await res.json();
        showMsg(err.error || "Gagal memperbarui aturan");
      }
    } else {
      // Create new
      const res = await fetch("/api/admin/point-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        showMsg("Aturan berhasil ditambahkan!");
        fetchRules();
      } else {
        const err = await res.json();
        showMsg(err.error || "Gagal menambahkan aturan");
      }
    }
  }

  async function handleToggleActive(rule: PointRule) {
    const res = await fetch(`/api/admin/point-rules/${rule.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !rule.isActive }),
    });
    if (res.ok) {
      showMsg(rule.isActive ? "Aturan dinonaktifkan" : "Aturan diaktifkan");
      fetchRules();
    } else {
      showMsg("Gagal mengubah status");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/point-rules/${deleteTarget.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      showMsg("Aturan berhasil dihapus");
      fetchRules();
    } else {
      const err = await res.json();
      showMsg(err.error || "Gagal menghapus aturan");
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">Point Rules</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {rules.length} aturan poin ·{' '}
            {rules.filter((r) => r.isActive).length} aktif
          </p>
        </div>
        <button
          onClick={() => {
            setEditingRule(null);
            setFormOpen(true);
          }}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Tambah Aturan
        </button>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div className="rounded-md bg-brand-50 p-3 text-sm text-brand-700">
          {actionMsg}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-ink-line bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-line bg-slate-50 text-xs font-medium text-ink-subtle">
              <th className="w-10 pb-3 pl-4 pr-2">No</th>
              <th className="pb-3 pr-3">Ikon</th>
              <th className="pb-3 pr-3">Nama</th>
              <th className="pb-3 pr-3 max-md:hidden">Deskripsi</th>
              <th className="pb-3 pr-3">Poin</th>
              <th className="pb-3 pr-3">Kategori</th>
              <th className="pb-3 pr-3">Status</th>
              <th className="pb-3 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm text-ink-muted">
                  Belum ada aturan poin. Klik &quot;Tambah Aturan&quot; untuk membuat yang pertama.
                </td>
              </tr>
            ) : (
              rules.map((rule, idx) => {
                const Icon = iconLookup[rule.icon] || Star;
                const cat = categoryConfig[rule.category] ?? categoryConfig.basic;
                return (
                  <tr
                    key={rule.id}
                    className="border-b border-ink-line last:border-0 hover:bg-slate-50"
                  >
                    <td className="py-3 pl-4 pr-2 text-xs text-ink-muted">
                      {rule.sortOrder}
                    </td>
                    <td className="py-3 pr-3">
                      <Icon className="h-5 w-5 text-brand-600" />
                    </td>
                    <td className="py-3 pr-3 font-medium text-ink">{rule.name}</td>
                    <td className="py-3 pr-3 text-xs text-ink-muted max-md:hidden">
                      {rule.description || "—"}
                    </td>
                    <td className="py-3 pr-3 font-semibold text-ink">
                      +{rule.points}
                    </td>
                    <td className="py-3 pr-3">
                      <span className={cn("chip text-xs", cat.className)}>
                        {cat.label}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <button
                        onClick={() => handleToggleActive(rule)}
                        className={cn(
                          "relative inline-flex h-5 w-9 items-center rounded-full transition",
                          rule.isActive ? "bg-brand-600" : "bg-slate-300"
                        )}
                        title={rule.isActive ? "Nonaktifkan" : "Aktifkan"}
                      >
                        <span
                          className={cn(
                            "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition",
                            rule.isActive ? "translate-x-[18px]" : "translate-x-[3px]"
                          )}
                        />
                      </button>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingRule(rule);
                            setFormOpen(true);
                          }}
                          className="rounded-md p-1.5 text-ink-muted hover:bg-slate-100 hover:text-ink"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(rule)}
                          className="rounded-md p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <RuleFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingRule(null);
        }}
        onSave={handleSave}
        initial={editingRule}
      />

      <DeleteConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        ruleName={deleteTarget?.name ?? ""}
      />
    </div>
  );
}
