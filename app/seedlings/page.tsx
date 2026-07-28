"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search, MapPin, Sprout, User, Star, ArrowRight,
  Package, TreePine, SearchX,
} from "lucide-react";
import { INDONESIAN_PROVINCES } from "@/lib/provinces";

type SeedlingItem = {
  id: string;
  species: string;
  count: number;
  province: string;
  regency: string;
  owner: string;
  trustScore: number;
};

const DUMMY: SeedlingItem[] = [
  { id: "1", species: "Jati", count: 50, province: "Jawa Barat", regency: "Bandung", owner: "Asep", trustScore: 85 },
  { id: "2", species: "Bambu Petung", count: 30, province: "Jawa Barat", regency: "Bogor", owner: "Sari", trustScore: 92 },
  { id: "3", species: "Mahoni", count: 100, province: "Jawa Barat", regency: "Garut", owner: "Budi", trustScore: 78 },
  { id: "4", species: "Sengon", count: 25, province: "Jawa Timur", regency: "Malang", owner: "Dewi", trustScore: 88 },
  { id: "5", species: "Suren", count: 40, province: "Jawa Tengah", regency: "Solo", owner: "Joko", trustScore: 90 },
  { id: "6", species: "Kaliandra", count: 200, province: "Jawa Timur", regency: "Banyuwangi", owner: "Rina", trustScore: 95 },
  { id: "7", species: "Acacia", count: 75, province: "Jawa Barat", regency: "Sukabumi", owner: "Agus", trustScore: 82 },
  { id: "8", species: "Albasia", count: 60, province: "Jawa Tengah", regency: "Semarang", owner: "Fitri", trustScore: 87 },
];

function SkeletonCard() {
  return (
    <div className="card pointer-events-none" aria-hidden>
      <div className="aspect-[16/10] w-full animate-shimmer rounded-t-xl bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%]" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-2/3 animate-shimmer rounded bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%]" />
        <div className="h-3 w-1/2 animate-shimmer rounded bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%]" />
        <div className="h-3 w-1/3 animate-shimmer rounded bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%]" />
      </div>
    </div>
  );
}

export default function SeedlingsPage() {
  const [province, setProvince] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [seedlings, setSeedlings] = useState<SeedlingItem[]>([]);
  const PER_PAGE = 9;

  useEffect(() => {
    fetch("/api/seedlings")
      .then(r => r.json())
      .then(data => {
        if (data.seedlings?.length > 0) {
          setSeedlings(data.seedlings.map((s: any) => ({
            id: s.id,
            species: s.species,
            count: s.quantity || s.count || 0,
            province: s.province || "",
            regency: s.regency || "",
            owner: s.user?.username || "Petani",
            trustScore: s.user?.trustScore || 50,
          })));
        } else if (Array.isArray(data)) {
          setSeedlings(data.map((s: any) => ({
            id: s.id,
            species: s.species,
            count: s.quantity || s.count || 0,
            province: s.province || "",
            regency: s.regency || "",
            owner: s.user?.username || "Petani",
            trustScore: s.user?.trustScore || 50,
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() =>
    seedlings.filter(s =>
      (!province || s.province === province) &&
      (!search || s.species.toLowerCase().includes(search.toLowerCase()))
    ),
    [province, search, seedlings]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Reset page saat filter berubah
  useEffect(() => { setPage(1); }, [province, search]);

  return (
    <main className="container-page py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-3 text-2xl font-extrabold text-ink md:text-3xl">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-50 to-green-100">
            <Sprout className="h-5 w-5 text-green-600" />
          </span>
          Bibit
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Cari dan minta bibit dari komunitas SpringHub
        </p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2.5">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
          <input
            type="text"
            placeholder="Cari jenis bibit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input w-full pl-9"
          />
        </div>
        <select
          value={province}
          onChange={e => setProvince(e.target.value)}
          className="input w-auto min-w-[140px] appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem] bg-[right_0.5rem_center] bg-no-repeat pr-8"
        >
          <option value="">Semua Provinsi</option>
          {INDONESIAN_PROVINCES.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex animate-fade flex-col items-center py-16 text-center">
          <SearchX className="mb-4 h-12 w-12 text-slate-300" />
          <h3 className="text-lg font-semibold text-ink">Bibit tidak ditemukan</h3>
          <p className="mt-1 text-sm text-ink-muted">Coba ganti filter atau kata kunci pencarian</p>
          <button onClick={() => { setSearch(""); setProvince(""); }} className="btn-soft mt-4">
            Reset Filter
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paged.map((s, i) => (
              <Link
                key={s.id}
                href={`/seedlings/${s.id}`}
                className="card group overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-elevated hover:border-green-200"
                style={{ animation: `fadeUp 0.5s ease-out ${i * 60}ms both` }}
              >
                <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                  <TreePine className="h-8 w-8 text-slate-300 transition-transform duration-300 group-hover:scale-110 dark:text-slate-500" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[1.0625rem] font-semibold leading-tight text-ink">{s.species}</h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      <Package className="h-3 w-3" />
                      {s.count}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-ink-muted">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {s.regency}, {s.province}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-ink-line pt-3">
                    <span className="flex items-center gap-1.5 text-sm text-ink-muted">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      {s.owner}
                      <span className="ml-0.5 inline-flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                        {s.trustScore}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-green-600 transition-all duration-200 group-hover:gap-1.5">
                      Minta <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-ink-line px-3 py-1.5 text-sm font-medium text-ink-muted transition hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  onClick={() => setPage(num)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    page === num
                      ? "bg-brand-600 text-white"
                      : "text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-ink-line px-3 py-1.5 text-sm font-medium text-ink-muted transition hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
