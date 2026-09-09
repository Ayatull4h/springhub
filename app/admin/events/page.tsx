"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, CalendarDays, ExternalLink, Users, Download, Sparkles, Image as ImageIcon } from "lucide-react";

type EventItem = {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  googleFormUrl: string;
  imageUrl: string;
  isActive: boolean;
  _count?: { registrations: number };
};

type Registrant = {
  id: string;
  nama: string;
  domisili: string;
  hari: number;
  wa: string;
  email: string;
  createdAt: string;
};

type GalleryPhoto = { id: string; storagePath: string; url: string; createdAt: string };

function toLocalInput(iso: string): string {
  try {
    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  } catch {
    return "";
  }
}

async function csrfHeaders(extra: Record<string, string> = {}) {
  const { token } = await fetch("/api/csrf").then((r) => r.json());
  return { ...extra, "x-csrf-token": token };
}

export default function AdminEventsPage() {
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [form, setForm] = useState({ title: "", description: "", location: "", startDate: "", endDate: "", googleFormUrl: "", imageUrl: "", isActive: true });
  const [regs, setRegs] = useState<Registrant[] | null>(null);
  const [regsFor, setRegsFor] = useState<EventItem | null>(null);
  const [gallery, setGallery] = useState<GalleryPhoto[] | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchItems = () => {
    setLoading(true);
    fetch("/api/admin/events")
      .then((r) => r.json())
      .then((d) => setItems(d.events || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, []);

  function resetForm() {
    setForm({ title: "", description: "", location: "", startDate: "", endDate: "", googleFormUrl: "", imageUrl: "", isActive: true });
  }

  function editItem(item: EventItem) {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description,
      location: item.location,
      startDate: toLocalInput(item.startDate),
      endDate: toLocalInput(item.endDate),
      googleFormUrl: item.googleFormUrl,
      imageUrl: item.imageUrl,
      isActive: item.isActive,
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch(editing ? `/api/admin/events/${editing.id}` : "/api/admin/events", {
        method: editing ? "PUT" : "POST",
        headers: await csrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          ...form,
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowForm(false);
        setEditing(null);
        resetForm();
        fetchItems();
      } else if (data.details) {
        setSaveError(Object.entries(data.details).map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`).join("; "));
      } else {
        setSaveError(data.error || "Gagal menyimpan");
      }
    } catch {
      setSaveError("Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus jadwal ini beserta semua pendaftarnya?")) return;
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE", headers: await csrfHeaders() });
      if (res.ok) fetchItems();
      else alert("Gagal menghapus");
    } catch {
      alert("Gagal menghapus");
    }
  }

  async function openRegs(item: EventItem) {
    setRegsFor(item);
    setRegs(null);
    const d = await fetch(`/api/admin/events/${item.id}/registrations`).then((r) => r.json());
    setRegs(d.registrations || []);
  }

  async function handleToRecap(item: EventItem) {
    if (!confirm(`Buat rekap "${item.title}" di Latest Media?`)) return;
    try {
      const res = await fetch(`/api/admin/events/${item.id}/to-recap`, { method: "POST", headers: await csrfHeaders() });
      const d = await res.json();
      alert(res.ok ? "Rekap dibuat di Latest Media (aktif)." : d.error || "Gagal");
    } catch {
      alert("Gagal");
    }
  }

  const [galleryQuery, setGalleryQuery] = useState("");
  const [galleryPage, setGalleryPage] = useState(1);
  const [galleryTotal, setGalleryTotal] = useState(0);
  const [galleryLoadingMore, setGalleryLoadingMore] = useState(false);

  async function openGallery(reset = true) {
    const page = reset ? 1 : galleryPage + 1;
    if (reset) {
      setGallery(null);
      setGalleryPage(1);
    } else {
      setGalleryLoadingMore(true);
    }
    const d = await fetch(`/api/admin/events/upload?q=${encodeURIComponent(galleryQuery)}&page=${page}&limit=24`).then((r) => r.json());
    const items = d.photos || [];
    setGallery((prev) => (reset || !prev ? items : [...prev, ...items]));
    setGalleryPage(page);
    setGalleryTotal(d.pagination?.total || 0);
    setGalleryLoadingMore(false);
  }

  async function handleUploadFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const res = await fetch("/api/admin/events/upload", { method: "POST", headers: await csrfHeaders(), body: fd });
      const d = await res.json();
      if (res.ok) {
        setForm((f) => ({ ...f, imageUrl: d.url }));
      } else {
        alert(d.error || "Upload gagal");
      }
    } catch {
      alert("Upload gagal");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">Jadwal Mendatang</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Atur jadwal restorasi/tanam pohon. Tempel link Google Form kalau ada — kalau kosong, tombol Daftar buka formulir internal. Tanpa kuota.
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
          <p className="text-ink-muted">Belum ada jadwal. Tambah jadwal pertama, misal “Restorasi Umbul Ponggok”.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="card flex flex-col">
              {item.imageUrl && (
                <div className="-mx-4 -mt-4 mb-3 h-32 overflow-hidden rounded-t-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                </div>
              )}
              <span className="chip flex w-fit items-center gap-1 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                <CalendarDays className="h-3 w-3" /> {item.isActive ? "Aktif" : "Nonaktif"}
              </span>
              <h3 className="mt-2 text-sm font-semibold text-ink">{item.title}</h3>
              <p className="text-xs text-ink-muted">
                {new Date(item.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                {" — "}
                {new Date(item.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                {item.location ? ` · ${item.location}` : ""}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-ink-subtle">
                <Users className="h-3 w-3" /> {item._count?.registrations ?? 0} pendaftar
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <button onClick={() => openRegs(item)} className="rounded-md border border-ink-line px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-slate-50 dark:hover:bg-slate-800">
                  Pendaftar
                </button>
                <button onClick={() => handleToRecap(item)} title="Jadikan rekap di Latest Media" className="inline-flex items-center gap-1 rounded-md border border-ink-line px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Sparkles className="h-3 w-3" /> Rekap
                </button>
                <button onClick={() => editItem(item)} className="rounded-md p-1.5 text-ink-muted hover:bg-slate-100" aria-label="Edit">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(item.id)} className="rounded-md p-1.5 text-ink-muted hover:bg-red-50 hover:text-red-600" aria-label="Hapus">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal pendaftar */}
      {regsFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4" onClick={() => { setRegsFor(null); setRegs(null); }}>
          <div className="my-8 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-ink">Pendaftar: {regsFor.title}</h3>
            {regs === null ? (
              <p className="py-8 text-center text-sm text-ink-muted">Memuat...</p>
            ) : regs.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-muted">Belum ada pendaftar.</p>
            ) : (
              <>
                <a href={`/api/admin/events/${regsFor.id}/registrations?format=csv`} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
                  <Download className="h-3 w-3" /> Export CSV ({regs.length})
                </a>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-ink-line text-ink-muted">
                        <th className="py-2 pr-2">Nama</th>
                        <th className="py-2 pr-2">Domisili</th>
                        <th className="py-2 pr-2">Hari</th>
                        <th className="py-2 pr-2">WA</th>
                        <th className="py-2">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {regs.map((r) => (
                        <tr key={r.id} className="border-b border-ink-line/50 text-ink">
                          <td className="py-2 pr-2 font-medium">{r.nama}</td>
                          <td className="py-2 pr-2">{r.domisili || "-"}</td>
                          <td className="py-2 pr-2">{r.hari}</td>
                          <td className="py-2 pr-2">{r.wa}</td>
                          <td className="py-2">{r.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <div className="mt-4 flex justify-end">
              <button onClick={() => { setRegsFor(null); setRegs(null); }} className="rounded-md border border-ink-line px-4 py-2 text-sm text-ink hover:bg-slate-50 dark:hover:bg-slate-800">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal tambah/edit */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="my-8 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-ink">{editing ? "Edit Jadwal" : "Tambah Jadwal"}</h3>
            <form onSubmit={handleSave} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-ink-muted">Judul kegiatan</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="cth: Restorasi Umbul Ponggok" className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm dark:bg-slate-800 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-ink-muted">Tanggal mulai</label>
                  <input required type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm dark:bg-slate-800 dark:text-white" />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-muted">Tanggal selesai</label>
                  <input required type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm dark:bg-slate-800 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Tempat</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="cth: Cepogo, Boyolali" className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm dark:bg-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Link Google Form (opsional — kalau diisi, tombol Daftar buka form ini)</label>
                <input value={form.googleFormUrl} onChange={(e) => setForm({ ...form, googleFormUrl: e.target.value })} placeholder="https://docs.google.com/forms/..." className="mt-1 w-full rounded-md border border-ink-line px-3 py-2 text-sm dark:bg-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-muted">Thumbnail</label>
                <div className="mt-1 flex gap-2">
                  <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="URL gambar atau upload / pilih di bawah" className="w-full rounded-md border border-ink-line px-3 py-2 text-sm dark:bg-slate-800 dark:text-white" />
                  <label className="flex-none cursor-pointer rounded-md border border-ink-line px-3 py-2 text-xs font-medium text-ink hover:bg-slate-50 dark:hover:bg-slate-800">
                    {uploading ? "..." : "Upload"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadFile(f); }} />
                  </label>
                </div>
                {form.imageUrl && (
                  <div className="mt-2 h-28 overflow-hidden rounded-md border border-ink-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.imageUrl} alt="Preview" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}
                <button type="button" onClick={() => openGallery(true)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
                  <ImageIcon className="h-3 w-3" /> Pilih dari foto SpringHub
                </button>
                {gallery && (
                  <div className="mt-2 rounded-md border border-ink-line p-1">
                    <div className="flex gap-1 p-1">
                      <input
                        value={galleryQuery}
                        onChange={(e) => setGalleryQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); openGallery(true); } }}
                        placeholder="Cari nama file... (Enter)"
                        className="w-full rounded border border-ink-line px-2 py-1 text-xs dark:bg-slate-800 dark:text-white"
                      />
                      <button type="button" onClick={() => openGallery(true)} className="rounded bg-slate-100 px-2 py-1 text-xs dark:bg-slate-700">
                        Cari
                      </button>
                    </div>
                    <div className="grid max-h-40 grid-cols-4 gap-1 overflow-y-auto p-1">
                      {gallery.length === 0 && <p className="col-span-4 p-2 text-center text-xs text-ink-muted">Tidak ada foto.</p>}
                      {gallery.map((g) => (
                        <button type="button" key={g.id} onClick={() => { setForm((f) => ({ ...f, imageUrl: g.url })); setGallery(null); }} className="h-14 overflow-hidden rounded">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={g.url} alt="" className="h-full w-full object-cover hover:opacity-80" loading="lazy" />
                        </button>
                      ))}
                    </div>
                    <p className="px-1 py-1 text-[10px] text-ink-subtle">
                      {gallery.length} dari {galleryTotal} foto
                      {gallery.length < galleryTotal && (
                        <button type="button" onClick={() => openGallery(false)} disabled={galleryLoadingMore} className="ml-2 font-medium text-brand-600 hover:underline disabled:opacity-50">
                          {galleryLoadingMore ? "Memuat..." : "Muat lagi ↓"}
                        </button>
                      )}
                    </p>
                  </div>
                )}
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
