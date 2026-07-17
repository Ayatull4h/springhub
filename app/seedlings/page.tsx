"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MapPin, Sprout } from "lucide-react";
import { INDONESIAN_PROVINCES } from "@/lib/provinces";
import { useI18n } from "@/lib/i18n";

type SeedlingItem = {
  id: string;
  species: string;
  count: number;
  province: string;
  regency: string;
  owner: string;
  trustScore: number;
  createdAt: string;
};

const DUMMY: SeedlingItem[] = [
  { id: "1", species: "Jati", count: 50, province: "Jawa Barat", regency: "Bandung", owner: "Asep", trustScore: 85, createdAt: "2026-07-10" },
  { id: "2", species: "Bambu Petung", count: 30, province: "Jawa Barat", regency: "Bogor", owner: "Sari", trustScore: 92, createdAt: "2026-07-12" },
  { id: "3", species: "Mahoni", count: 100, province: "Jawa Barat", regency: "Garut", owner: "Budi", trustScore: 78, createdAt: "2026-07-08" },
  { id: "4", species: "Sengon", count: 25, province: "Jawa Timur", regency: "Malang", owner: "Dewi", trustScore: 88, createdAt: "2026-07-14" },
  { id: "5", species: "Suren", count: 40, province: "Jawa Tengah", regency: "Solo", owner: "Joko", trustScore: 90, createdAt: "2026-07-05" },
  { id: "6", species: "Kaliandra", count: 200, province: "Jawa Timur", regency: "Banyuwangi", owner: "Rina", trustScore: 95, createdAt: "2026-07-13" },
  { id: "7", species: "Acacia", count: 75, province: "Jawa Barat", regency: "Sukabumi", owner: "Agus", trustScore: 82, createdAt: "2026-07-11" },
  { id: "8", species: "Albasia", count: 60, province: "Jawa Tengah", regency: "Semarang", owner: "Fitri", trustScore: 87, createdAt: "2026-07-09" },
];

export default function SeedlingsPage() {
  const { t } = useI18n();
  const [province, setProvince] = useState("");
  const [search, setSearch] = useState("");

  const filtered = DUMMY.filter(s =>
    (!province || s.province === province) &&
    (!search || s.species.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <main className="container-page py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <Sprout className="h-6 w-6 text-brand-600" />
          {t("seedlings.title") || "Bibit Tersedia"}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {t("seedlings.subtitle") || "Cari dan minta bibit dari komunitas SpringHub"}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder={t("seedlings.searchPlaceholder") || "Cari jenis bibit..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-ink-line px-3 py-2 pl-9 text-sm"
          />
        </div>
        <select
          value={province}
          onChange={e => setProvince(e.target.value)}
          className="rounded-lg border border-ink-line px-3 py-2 text-sm"
        >
          <option value="">{t("seedlings.allProvince") || "Semua Provinsi"}</option>
          {INDONESIAN_PROVINCES.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(s => (
          <Link
            key={s.id}
            href={`/seedlings/${s.id}`}
            className="card overflow-hidden transition hover:border-brand-300"
          >
            <div className="flex aspect-video items-center justify-center bg-slate-100 text-sm text-slate-400 dark:bg-slate-800">
              📷 {t("seedlings.photoPlaceholder") || "Foto Bibit"}
            </div>
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-ink">{s.species}</h3>
                <span className="chip bg-brand-50 text-brand-700">{s.count} {t("seedlings.unit") || "bibit"}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-ink-muted">
                <MapPin className="h-3.5 w-3.5" />
                {s.regency}, {s.province}
              </div>
              <div className="flex items-center justify-between border-t border-ink-line pt-2">
                <span className="text-sm text-ink-muted">👤 {s.owner} · ⭐ {s.trustScore}</span>
                <span className="text-xs font-medium text-brand-600 hover:underline">
                  {t("seedlings.request") || "Minta"} &rarr;
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-ink-muted">
          {t("seedlings.empty") || "Tidak ada bibit ditemukan"}
        </div>
      )}
    </main>
  );
}
