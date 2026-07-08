"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useToast } from "@/components/toast";
import { Plus, Save, Trash2, ChevronDown, ChevronUp, Eye, EyeOff, MapIcon, Settings, FormInput } from "lucide-react";

const AdminMapPreview = dynamic(
  () => import("@/components/map/admin-map-preview"),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-sm text-ink-muted">Loading peta…</div> }
);

type Category = {
  id: string;
  slug: string;
  name: string;
  color: string;
  sortOrder: number;
};

type MapType = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  categories: Category[];
  _count: { points: number; forms: number };
};

async function csrfHeaders(): Promise<Record<string, string>> {
  try {
    const { token } = await fetch("/api/csrf").then(r => r.json());
    return { "Content-Type": "application/json", "x-csrf-token": token };
  } catch {
    return { "Content-Type": "application/json" };
  }
}

type MapPointItem = {
  id: string;
  name: string;
  slug: string;
  snappedLat: number | null;
  snappedLng: number | null;
  type: { id: string; slug: string; name: string };
  category: { id: string; slug: string; name: string; color: string } | null;
  _count: { reports: number };
};

type FormItem = {
  id: string;
  slug: string;
  title: string;
  isActive: boolean;
  mapTypeId: string | null;
  mapType?: { id: string; slug: string; name: string } | null;
};

export default function AdminMapPage() {
  const { toast } = useToast();
  const [types, setTypes] = useState<MapType[]>([]);
  const [points, setPoints] = useState<MapPointItem[]>([]);
  const [formsList, setFormsList] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [view, setView] = useState<"settings" | "map">("settings");

  const [newType, setNewType] = useState({
    slug: "",
    name: "",
    description: "",
    icon: "MapPin",
    categories: [{ slug: "", name: "", color: "#22c55e" }],
  });

  useEffect(() => {
    Promise.all([fetchTypes(), fetchPoints(), fetchForms()]);
  }, []);

  async function fetchTypes() {
    try {
      const res = await fetch("/api/admin/map-types");
      if (res.ok) {
        const data = await res.json();
        setTypes(data.types);
      }
    } catch {
      toast("Gagal memuat data", "error");
    }
  }

  async function fetchPoints() {
    try {
      const res = await fetch("/api/admin/map-points");
      if (res.ok) {
        const data = await res.json();
        setPoints(data.points || []);
      }
    } catch { /* silent */ }
  }

  async function fetchForms() {
    try {
      const res = await fetch("/api/forms");
      if (res.ok) {
        const data = await res.json();
        setFormsList(data.forms || []);
      }
    } catch { /* silent */ }
  }

  function setLoadingSafe(v: boolean) {
    // loading selesai setelah semua fetch selesai
  }

  useEffect(() => {
    if (types.length > 0 || points.length > 0 || formsList.length > 0) {
      setLoading(false);
    }
  }, [types, points, formsList]);

  async function toggleTypeActive(type: MapType) {
    const res = await fetch(`/api/admin/map-types/${type.id}`, {
      method: "PUT",
      headers: await csrfHeaders(),
      body: JSON.stringify({ isActive: !type.isActive }),
    });
    if (res.ok) {
      toast(type.isActive ? "Tipe dinonaktifkan" : "Tipe diaktifkan", "success");
      fetchTypes();
    } else {
      toast("Gagal update", "error");
    }
  }

  async function updateCategoryColor(catId: string, color: string) {
    for (const t of types) {
      const cat = t.categories.find((c) => c.id === catId);
      if (cat) {
        const updatedCategories = t.categories.map((c) =>
          c.id === catId ? { ...c, color } : { slug: c.slug, name: c.name, color: c.color }
        );
        const res = await fetch(`/api/admin/map-types/${t.id}`, {
          method: "PUT",
          headers: await csrfHeaders(),
          body: JSON.stringify({ categories: updatedCategories }),
        });
        if (res.ok) {
          toast("Warna diperbarui", "success");
          fetchTypes();
        } else {
          toast("Gagal update warna", "error");
        }
        break;
      }
    }
  }

  async function deleteType(id: string) {
    if (!confirm("Hapus tipe ini?")) return;
    const res = await fetch(`/api/admin/map-types/${id}`, { method: "DELETE", headers: await csrfHeaders() });
    if (res.ok) {
      toast("Tipe dihapus/dinonaktifkan", "success");
      fetchTypes();
    } else {
      toast("Gagal menghapus", "error");
    }
  }

  async function createType() {
    if (!newType.slug || !newType.name) {
      toast("Slug dan nama wajib diisi", "error");
      return;
    }
    const res = await fetch("/api/admin/map-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newType),
    });
    if (res.ok) {
      toast("Tipe baru dibuat", "success");
      setShowNewForm(false);
      setNewType({
        slug: "",
        name: "",
        description: "",
        icon: "MapPin",
        categories: [{ slug: "", name: "", color: "#22c55e" }],
      });
      fetchTypes();
    } else {
      const data = await res.json();
      toast(data.error || "Gagal membuat tipe", "error");
    }
  }

  // Forms linked to each map type (MUST be before early return — hooks order)
  const formsByType = useMemo(() => {
    const map = new Map<string, FormItem[]>();
    for (const f of formsList) {
      const typeId = f.mapType?.id || f.mapTypeId;
      if (typeId) {
        const list = map.get(typeId) || [];
        list.push(f);
        map.set(typeId, list);
      }
    }
    return map;
  }, [formsList]);

  // Points with valid coordinates
  const validPoints = useMemo(
    () => points.filter(p => p.snappedLat !== null && p.snappedLng !== null) as (MapPointItem & { snappedLat: number; snappedLng: number })[],
    [points]
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Pengaturan Peta</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Kelola tipe titik, kategori, dan warna marker di peta
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="mr-2 flex overflow-hidden rounded-lg border border-ink-line">
            <button
              onClick={() => setView("settings")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "settings"
                  ? "bg-brand-600 text-white"
                  : "bg-white text-ink-muted hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700"
              }`}
            >
              <Settings size={14} /> Pengaturan
            </button>
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "map"
                  ? "bg-brand-600 text-white"
                  : "bg-white text-ink-muted hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700"
              }`}
            >
              <MapIcon size={14} /> Peta ({validPoints.length})
            </button>
          </div>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-white transition-colors hover:bg-brand-700"
          >
            <Plus size={18} />
            Tipe Baru
          </button>
        </div>
      </div>

      {/* Map View */}
      {view === "map" && (
        <div className="card overflow-hidden p-0">
          <div className="border-b border-ink-line px-4 py-2">
            <h3 className="text-sm font-semibold text-ink">Pratinjau Peta</h3>
            <p className="text-xs text-ink-muted">
              {validPoints.length} titik dengan {formsList.length} form terhubung
            </p>
          </div>
          <div className="aspect-[16/9] w-full min-h-[400px]">
            <AdminMapPreview points={validPoints} formsByType={formsByType} />
          </div>
        </div>
      )}

      {/* New Type Form */}
      {showNewForm && (
        <div className="rounded-xl border border-ink-line bg-white p-4 shadow-card dark:border-slate-700 dark:bg-slate-800 md:p-6">
          <h3 className="text-lg font-semibold text-ink dark:text-slate-100">Tambah Tipe Baru</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-ink-muted">Slug *</label>
              <input
                type="text"
                value={newType.slug}
                onChange={(e) => setNewType({ ...newType, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                className="input w-full"
                placeholder="contoh: konservasi-flora"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink-muted">Nama *</label>
              <input
                type="text"
                value={newType.name}
                onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                className="input w-full"
                placeholder="Konservasi Flora"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-sm text-ink-muted">Deskripsi</label>
            <input
              type="text"
              value={newType.description}
              onChange={(e) => setNewType({ ...newType, description: e.target.value })}
              className="input w-full"
              placeholder="Deskripsi tipe titik"
            />
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm text-ink-muted">Kategori</label>
              <button
                type="button"
                onClick={() =>
                  setNewType({
                    ...newType,
                    categories: [...newType.categories, { slug: "", name: "", color: "#22c55e" }],
                  })
                }
                className="text-xs text-brand-600 hover:text-brand-700"
              >
                + Tambah kategori
              </button>
            </div>
            <div className="space-y-2">
              {newType.categories.map((cat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cat.color}
                    onChange={(e) => {
                      const cats = [...newType.categories];
                      cats[i].color = e.target.value;
                      setNewType({ ...newType, categories: cats });
                    }}
                    className="h-10 w-10 cursor-pointer rounded"
                  />
                  <input
                    type="text"
                    value={cat.slug}
                    onChange={(e) => {
                      const cats = [...newType.categories];
                      cats[i].slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                      setNewType({ ...newType, categories: cats });
                    }}
                    className="input w-1/3 text-sm"
                    placeholder="slug"
                  />
                  <input
                    type="text"
                    value={cat.name}
                    onChange={(e) => {
                      const cats = [...newType.categories];
                      cats[i].name = e.target.value;
                      setNewType({ ...newType, categories: cats });
                    }}
                    className="input flex-1 text-sm"
                    placeholder="Nama kategori"
                  />
                  {newType.categories.length > 1 && (
                    <button
                      onClick={() => {
                        const cats = newType.categories.filter((_, idx) => idx !== i);
                        setNewType({ ...newType, categories: cats });
                      }}
                      className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={createType} className="btn-primary">
              <Save size={16} /> Simpan
            </button>
            <button onClick={() => setShowNewForm(false)} className="btn-secondary">
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Types List */}
      <div className="space-y-3">
        {types.map((type) => (
          <div
            key={type.id}
            className={`overflow-hidden rounded-xl border bg-white shadow-card dark:bg-slate-800 ${
              type.isActive ? "border-ink-line dark:border-slate-700" : "border-ink-line/50 opacity-60 dark:border-slate-700/50"
            }`}
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setExpandedId(expandedId === type.id ? null : type.id)}
                  className="rounded p-1 text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  {expandedId === type.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <div>
                  <h3 className="font-semibold text-ink dark:text-slate-200">{type.name}</h3>
                  <p className="text-xs text-ink-subtle dark:text-slate-500">
                    {type._count.points} titik · {type._count.forms} form terhubung
                    {type.description && ` · ${type.description}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {type.categories.slice(0, 4).map((cat) => (
                  <span
                    key={cat.id}
                    className="inline-block h-4 w-4 rounded-full border border-ink-line dark:border-slate-600"
                    style={{ backgroundColor: cat.color }}
                    title={cat.name}
                  />
                ))}
                {type.categories.length > 4 && (
                  <span className="text-xs text-ink-subtle">+{type.categories.length - 4}</span>
                )}
                <button
                  onClick={() => toggleTypeActive(type)}
                  className={`rounded-lg p-2 transition-colors ${
                    type.isActive
                      ? "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-slate-700"
                      : "text-ink-subtle hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                  title={type.isActive ? "Nonaktifkan" : "Aktifkan"}
                >
                  {type.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  onClick={() => deleteType(type.id)}
                  className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-slate-700"
                  title="Hapus"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {expandedId === type.id && (
              <div className="border-t border-ink-line px-4 pb-4 pt-3 dark:border-slate-700">
                {/* ── Form Terhubung ── */}
                {(() => {
                  const linkedForms = formsByType.get(type.id) || [];
                  return linkedForms.length > 0 ? (
                    <div className="mb-4">
                      <h4 className="mb-2 text-sm font-medium text-ink-muted">
                        <FormInput size={14} className="inline mr-1" />
                        Form Terhubung ({linkedForms.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {linkedForms.map((f) => (
                          <Link
                            key={f.id}
                            href={`/admin/forms/${f.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-line/60 bg-white px-3 py-1.5 text-xs text-ink transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-700"
                          >
                            <span className={`h-2 w-2 rounded-full ${f.isActive ? "bg-green-500" : "bg-slate-300"}`} />
                            {f.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* ── Atur Warna Kategori ── */}
                <h4 className="mb-3 text-sm font-medium text-ink-muted">
                  Atur Warna Kategori
                </h4>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {type.categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-3 rounded-lg border border-ink-line/60 bg-white p-3 dark:border-slate-700 dark:bg-slate-700/50"
                    >
                      <input
                        type="color"
                        value={cat.color}
                        onChange={(e) => updateCategoryColor(cat.id, e.target.value)}
                        className="h-10 w-10 shrink-0 cursor-pointer rounded"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm text-ink dark:text-slate-200">{cat.name}</p>
                        <p className="text-xs text-ink-subtle dark:text-slate-500">/{cat.slug}</p>
                      </div>
                      <span className="ml-auto rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {cat.color}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {types.length === 0 && (
          <div className="py-12 text-center text-ink-subtle">
            Belum ada tipe titik. Klik &quot;Tipe Baru&quot; untuk membuat.
          </div>
        )}
      </div>
    </div>
  );
}
