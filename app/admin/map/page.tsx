"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/toast";
import { Plus, Save, Trash2, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";

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

export default function AdminMapPage() {
  const { toast } = useToast();
  const [types, setTypes] = useState<MapType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  // New type form
  const [newType, setNewType] = useState({
    slug: "",
    name: "",
    description: "",
    icon: "MapPin",
    categories: [{ slug: "", name: "", color: "#22c55e" }],
  });

  useEffect(() => {
    fetchTypes();
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
    } finally {
      setLoading(false);
    }
  }

  async function toggleTypeActive(type: MapType) {
    const res = await fetch(`/api/admin/map-types/${type.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
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
    // Find the type that contains this category
    for (const t of types) {
      const cat = t.categories.find((c) => c.id === catId);
      if (cat) {
        const updatedCategories = t.categories.map((c) =>
          c.id === catId ? { ...c, color } : { slug: c.slug, name: c.name, color: c.color }
        );
        const res = await fetch(`/api/admin/map-types/${t.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
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
    const res = await fetch(`/api/admin/map-types/${id}`, { method: "DELETE" });
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Pengaturan Peta</h1>
          <p className="text-slate-400 text-sm mt-1">
            Kelola tipe titik, kategori, dan warna marker di peta
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          Tipe Baru
        </button>
      </div>

      {/* New Type Form */}
      {showNewForm && (
        <div className="bg-slate-800 rounded-xl p-4 md:p-6 border border-slate-700 space-y-4">
          <h3 className="text-lg font-semibold text-slate-200">Tambah Tipe Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Slug *</label>
              <input
                type="text"
                value={newType.slug}
                onChange={(e) => setNewType({ ...newType, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                className="w-full px-3 py-2 bg-slate-700 rounded-lg text-slate-200 border border-slate-600 focus:border-cyan-500 outline-none"
                placeholder="contoh: konservasi-flora"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nama *</label>
              <input
                type="text"
                value={newType.name}
                onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 rounded-lg text-slate-200 border border-slate-600 focus:border-cyan-500 outline-none"
                placeholder="Konservasi Flora"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Deskripsi</label>
            <input
              type="text"
              value={newType.description}
              onChange={(e) => setNewType({ ...newType, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 rounded-lg text-slate-200 border border-slate-600 focus:border-cyan-500 outline-none"
              placeholder="Deskripsi tipe titik"
            />
          </div>

          {/* Categories input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-slate-400">Kategori</label>
              <button
                type="button"
                onClick={() =>
                  setNewType({
                    ...newType,
                    categories: [...newType.categories, { slug: "", name: "", color: "#22c55e" }],
                  })
                }
                className="text-xs text-cyan-400 hover:text-cyan-300"
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
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={cat.slug}
                    onChange={(e) => {
                      const cats = [...newType.categories];
                      cats[i].slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                      setNewType({ ...newType, categories: cats });
                    }}
                    className="w-1/3 px-3 py-2 bg-slate-700 rounded-lg text-slate-200 border border-slate-600 focus:border-cyan-500 outline-none text-sm"
                    placeholder="slug (contoh: pohon-langka)"
                  />
                  <input
                    type="text"
                    value={cat.name}
                    onChange={(e) => {
                      const cats = [...newType.categories];
                      cats[i].name = e.target.value;
                      setNewType({ ...newType, categories: cats });
                    }}
                    className="flex-1 px-3 py-2 bg-slate-700 rounded-lg text-slate-200 border border-slate-600 focus:border-cyan-500 outline-none text-sm"
                    placeholder="Nama kategori"
                  />
                  {newType.categories.length > 1 && (
                    <button
                      onClick={() => {
                        const cats = newType.categories.filter((_, idx) => idx !== i);
                        setNewType({ ...newType, categories: cats });
                      }}
                      className="p-2 text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={createType}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
            >
              Simpan
            </button>
            <button
              onClick={() => setShowNewForm(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
            >
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
            className={`bg-slate-800 rounded-xl border ${
              type.isActive ? "border-slate-700" : "border-slate-700/50 opacity-60"
            } overflow-hidden`}
          >
            {/* Type Header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setExpandedId(expandedId === type.id ? null : type.id)}
                  className="p-1 hover:bg-slate-700 rounded"
                >
                  {expandedId === type.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <div>
                  <h3 className="text-slate-200 font-semibold">{type.name}</h3>
                  <p className="text-xs text-slate-500">
                    {type._count.points} titik · {type._count.forms} form terhubung
                    {type.description && ` · ${type.description}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {type.categories.slice(0, 4).map((cat) => (
                  <span
                    key={cat.id}
                    className="inline-block w-4 h-4 rounded-full border border-slate-600"
                    style={{ backgroundColor: cat.color }}
                    title={cat.name}
                  />
                ))}
                {type.categories.length > 4 && (
                  <span className="text-xs text-slate-500">+{type.categories.length - 4}</span>
                )}
                <button
                  onClick={() => toggleTypeActive(type)}
                  className={`p-2 rounded-lg transition-colors ${
                    type.isActive
                      ? "text-green-400 hover:bg-slate-700"
                      : "text-slate-500 hover:bg-slate-700"
                  }`}
                  title={type.isActive ? "Nonaktifkan" : "Aktifkan"}
                >
                  {type.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  onClick={() => deleteType(type.id)}
                  className="p-2 text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                  title="Hapus"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Expanded Categories */}
            {expandedId === type.id && (
              <div className="px-4 pb-4 border-t border-slate-700 pt-3">
                <h4 className="text-sm font-medium text-slate-400 mb-3">
                  Atur Warna Kategori
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {type.categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-3 bg-slate-700/50 rounded-lg p-3"
                    >
                      <input
                        type="color"
                        value={cat.color}
                        onChange={(e) => updateCategoryColor(cat.id, e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm text-slate-200 truncate">{cat.name}</p>
                        <p className="text-xs text-slate-500">/{cat.slug}</p>
                      </div>
                      <span
                        className="ml-auto text-xs font-mono px-2 py-1 rounded bg-slate-800 text-slate-400"
                      >
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
          <div className="text-center py-12 text-slate-500">
            Belum ada tipe titik. Klik &quot;Tipe Baru&quot; untuk membuat.
          </div>
        )}
      </div>
    </div>
  );
}
