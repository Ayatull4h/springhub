"use client";

import { useEffect, useState } from "react";
import { Download, Image } from "lucide-react";

type SpringItem = {
  id: string;
  name: string;
  province: string;
  regency: string;
  status: string;
  reportCount: number;
  createdAt: string;
};

export default function AdminDownloadPage() {
  const [springs, setSprings] = useState<SpringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<SpringItem | null>(null);

  useEffect(() => {
    fetch("/api/admin/springs?status=active&limit=200")
      .then((r) => r.json())
      .then((d) => setSprings(d.springs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = springs.filter((s) =>
    !q.trim() ||
    s.name.toLowerCase().includes(q.toLowerCase()) ||
    s.province.toLowerCase().includes(q.toLowerCase()) ||
    s.regency.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink">Download Foto per Mata Air</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Pilih mata air, lalu download ZIP berisi semua foto + data.csv. File diambil langsung dari server.
        </p>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari nama, provinsi, kabupaten..."
        className="w-full max-w-md rounded-lg border border-ink-line px-3 py-2 text-sm dark:bg-slate-800 dark:text-white"
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <div key={s.id} className={`card flex flex-col ${selected?.id === s.id ? "ring-2 ring-brand-500" : ""}`}>
              <h3 className="text-sm font-semibold text-ink">{s.name}</h3>
              <p className="text-xs text-ink-muted">{[s.province, s.regency].filter(Boolean).join(", ") || "-"}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-ink-subtle">
                <Image className="h-3 w-3" /> {s.reportCount} laporan
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setSelected(s)}
                  className="rounded-md border border-ink-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Pilih
                </button>
                <a
                  href={`/api/admin/springs/${s.id}/download`}
                  className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
                >
                  <Download className="h-3 w-3" /> Download ZIP
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="card border-brand-300 bg-brand-50/50 dark:bg-brand-900/20">
          <p className="text-sm text-ink">
            Dipilih: <strong>{selected.name}</strong> ({selected.reportCount} laporan) —{" "}
            <a href={`/api/admin/springs/${selected.id}/download`} className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
              klik untuk download ZIP
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
