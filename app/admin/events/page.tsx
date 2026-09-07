"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, CalendarDays, ExternalLink } from "lucide-react";

type EventItem = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  linkLabel: string;
  data: string;
  sortOrder: number;
  isActive: boolean;
};

function parseData(raw: string): { date: string; location: string } {
  try {
    const d = JSON.parse(raw || "{}");
    return { date: d.date || "", location: d.location || "" };
  } catch {
    return { date: "", location: "" };
  }
}

export default function AdminEventsPage() {
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [form, setForm] = useState({ title: "", date: "", location: "", description: "", googleFormUrl: "", isActive: true });

  const fetchItems = () => {
    setLoading(true);
    fetch("/api/admin/content?section=events")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, []);

  function resetForm() {
    setForm({ title: "", date: "", location: "", description: "", googleFormUrl: "", isActive: true });
  }

  function editItem(item: EventItem) {
    const extra = parseData(item.data);
    setEditing(item);
    setForm({
      title: item.title,
      date: extra.date,
      location: extra.location,
      description: item.description,
      googleFormUrl: item.linkUrl,
      isActive: item.isActive,
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      const { token: csrfToken } = await fetch("/api/csrf").then((r) => r.json());
      const payload = {
        section: "events",
        type: "event",
        title: form.title,
        subtitle: [form.date, form.location].filter(Boolean).join(" · "),
        description: form.description,
        imageUrl: "",
        linkUrl: form.googleFormUrl,
        linkLabel: "Daftar via Google Form",
        data: JSON.stringify({ date: form.date, location: form.location }),
        sortOrder: 0,
        isActive: form.isActive,
      };
      const res = await fetch(editing ? `/api/admin/content/${editing.id}` : "/api/admin/content", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowForm(false);
        setEditing(null);
        resetForm();
        fetchItems();
      } else {
        const d = await res.json();
        setSaveError(d.error || "Gagal menyimpan");
      }
    } catch {
      setSaveError("Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus jadwal ini?")) return;
    try {
      const { token: csrfToken } = await fetch("/api/csrf").then((r) => r.json());
      const res = await fetch(`/api/admin/content/${id}`, { method: "DELETE", headers: { "x-csrf-token": csrfToken } });
      if (res.ok) fetchItems();
      else alert("Gagal menghapus");
    } catch {
      alert("Gagal menghapus");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">Jadwal Event</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Atur jadwal di sini, tempel link Google Form yang sudah ada — tidak perlu isi 2 kali. Tombol “Daftar” di halaman depan langsung buka Google Form.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Tambah Jadwal
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-ink-muted">Belum ada jadwal. Tambah jadwal pertama, misal “Data Collection Boyolali”.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const extra = parseData(item.data);
            return (
              <div key={item.id} className="card flex flex-col">
                <span className="chip bg-amber-100 text-amber-700 flex w-fit items-center gap-1 dark:bg-amber-900/30 dark:text-amber-300">
                  <CalendarDays className="h-3 w-3" /> {extra.date || "Tanpa tanggal"}
                </span>
                <h3 className="mt-2 text-sm font-semibold text-ink">{item.title}</h3>
                {extra.location && <p className="text-xs text-ink-muted">{extra.location}</p>}
                {item.description && <p className="mt-1 line-clamp-2 text-xs text-ink-subtle">{item.description}</p>}
                {item.linkUrl && (
                  <a href={item.linkUrl} target="_blank" className="mt-2 inline-flex items-center gap-1 text-xs text-brand-600 hover:underline">
                    {item.linkLabel || "Google Form"} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <div className="mt-auto flex items-center justify-between pt-3">
                  <span className="text-[10px] text-ink-subtle">{item.isActive ? "Aktif" : "Nonaktif"}</span>
                  <div className="flex gap-1">
                    <button onClick={() => editItem(item)} className="rounded-md p-1.5 text-ink-muted hover:bg-slate-100" aria-label="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="rounded-md p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600" aria-label="Hapus">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="my-8 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-ink">{editing ? "Edit Jadwal" : "Tambah Jadwal"}</h3>
            <form onSubmit={handleSave} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-ink-muted">Judul kegiatan</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="cth: Data Collection Boyolali" className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm dark:bg-slate-800 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-ink-muted">Tanggal</label>
                  <input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="cth: Sab–Min, 5–7 Sep 2026" className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm dark:bg-slate-800 dark:text-white" />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-muted">Lokasi</label>
                  <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="cth: Cepogo, Boyolali" className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm dark:bg-slate-800 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Link Google Form (template yang sudah ada)</label>
                <input value={form.googleFormUrl} onChange={(e) => setForm({ ...form, googleFormUrl: e.target.value })} placeholder="https://docs.google.com/forms/..." className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm dark:bg-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Keterangan</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm dark:bg-slate-800 dark:text-white" />
              </div>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Tampilkan di halaman depan
              </label>
              {saveError && <p className="text-sm text-red-600">{saveError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-md border border-ink-line px-4 py-2 text-sm text-ink hover:bg-slate-50 dark:hover:bg-slate-800">Batal</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
