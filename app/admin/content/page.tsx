"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Image, ExternalLink, Video, FileText, Calendar } from "lucide-react";

type ContentItem = {
  id: string;
  section: string;
  type: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  linkLabel: string;
  data: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
};

const sections = [
  { id: "media", label: "📺 Media", types: ["video", "event", "publication", "press"] },
  { id: "projects", label: "🏗️ Featured Projects", types: ["project"] },
  { id: "stats", label: "📊 Impact Stats", types: ["stat"] },
];

export default function AdminContentPage() {
  const [activeSection, setActiveSection] = useState("media");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [form, setForm] = useState({
    section: "media",
    type: "video",
    title: "",
    subtitle: "",
    description: "",
    imageUrl: "",
    linkUrl: "",
    linkLabel: "",
    sortOrder: 0,
  });

  const fetchItems = () => {
    setLoading(true);
    fetch(`/api/admin/content?section=${activeSection}`)
      .then(r => r.json())
      .then(data => setItems(data.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, [activeSection]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    const url = editing
      ? `/api/admin/content/${editing.id}`
      : "/api/admin/content";
    const method = editing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, section: activeSection }),
      });

      if (res.ok) {
        setShowForm(false);
        setEditing(null);
        resetForm();
        fetchItems();
      } else {
        const data = await res.json();
        setSaveError(data.error || "Gagal menyimpan");
      }
    } catch {
      setSaveError("Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus item ini?")) return;
    try {
      const res = await fetch(`/api/admin/content/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchItems();
      } else {
        alert("Gagal menghapus");
      }
    } catch {
      alert("Gagal menghapus");
    }
  }

  function editItem(item: ContentItem) {
    setEditing(item);
    setForm({
      section: item.section,
      type: item.type,
      title: item.title,
      subtitle: item.subtitle,
      description: item.description,
      imageUrl: item.imageUrl,
      linkUrl: item.linkUrl,
      linkLabel: item.linkLabel,
      sortOrder: item.sortOrder,
    });
    setShowForm(true);
  }

  function resetForm() {
    setForm({ section: activeSection, type: "video", title: "", subtitle: "", description: "", imageUrl: "", linkUrl: "", linkLabel: "", sortOrder: 0 });
  }

  const typeIcon: Record<string, any> = {
    video: Video, event: Calendar, publication: FileText, press: FileText, project: ExternalLink, stat: Image,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-ink">Content Manager</h2>
        <button
          onClick={() => { setEditing(null); resetForm(); setShowForm(true); }}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Add {activeSection}
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 border-b border-ink-line pb-2">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              activeSection === s.id
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-ink-muted hover:bg-slate-200"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Content list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-ink-muted">No {activeSection} items yet.</p>
          <p className="text-xs text-ink-subtle mt-1">Click &ldquo;Add {activeSection}&rdquo; to create one.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(item => {
            const Icon = typeIcon[item.type] || Image;
            return (
              <div key={item.id} className="card flex flex-col">
                {item.imageUrl && (
                  <div className="-mx-4 -mt-4 mb-3 overflow-hidden rounded-t-xl">
                    <img src={item.imageUrl} alt={item.title} className="h-40 w-full object-cover" />
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <span className="chip bg-brand-50 text-brand-700 flex items-center gap-1">
                    <Icon className="h-3 w-3" /> {item.type}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => editItem(item)} className="rounded-md p-1.5 text-ink-muted hover:bg-slate-100">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="rounded-md p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="mt-2 text-sm font-semibold text-ink">{item.title}</h3>
                {item.subtitle && <p className="text-xs text-ink-muted">{item.subtitle}</p>}
                {item.linkUrl && (
                  <a href={item.linkUrl} target="_blank" className="mt-2 inline-flex items-center gap-1 text-xs text-brand-600 hover:underline">
                    {item.linkLabel || "Open link"} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <div className="mt-auto pt-3 text-[10px] text-ink-subtle">
                  Sort: {item.sortOrder}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-ink">{editing ? "Edit" : "Add"} {activeSection}</h3>
            <form onSubmit={handleSave} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-ink-muted">Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm">
                  {sections.find(s => s.id === activeSection)?.types.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Title *</label>
                <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Subtitle / Date</label>
                <input value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm" placeholder="e.g. Apr 2026 · 200 volunteers" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Image URL (YouTube thumbnail or photo)</label>
                <input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm" placeholder="https://images.unsplash.com/..." />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Link URL (YouTube or article)</label>
                <input value={form.linkUrl} onChange={e => setForm({...form, linkUrl: e.target.value})} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm" placeholder="https://youtube.com/watch?v=..." />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Link Label</label>
                <input value={form.linkLabel} onChange={e => setForm({...form, linkLabel: e.target.value})} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm" placeholder="Watch on YouTube" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-ink-muted">Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={e => setForm({...form, sortOrder: parseInt(e.target.value) || 0})} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-md border border-ink-line px-4 py-2 text-sm text-ink hover:bg-slate-50">Cancel</button>
                <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
