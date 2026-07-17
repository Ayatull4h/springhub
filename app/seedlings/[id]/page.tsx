"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MapPin, User, Send, ChevronLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type SeedlingDetail = {
  id: string;
  species: string;
  count: number;
  available: number;
  province: string;
  regency: string;
  owner: string;
  ownerPhone: string;
  trustScore: number;
  notes: string;
  createdAt: string;
};

const DUMMY_DETAIL: SeedlingDetail = {
  id: "1",
  species: "Jati",
  count: 50,
  available: 40,
  province: "Jawa Barat",
  regency: "Bandung",
  owner: "Asep",
  ownerPhone: "0812-3456-7890",
  trustScore: 85,
  notes: "Bibit siap tanam, sudah disemai 3 bulan. Tinggi rata-rata 50cm. Lokasi di daerah Cimenyan, Bandung. Hubungi untuk koordinasi ambil bibit.",
  createdAt: "2026-07-10",
};

const PHOTO_COUNT = 4;

export default function SeedlingDetailPage() {
  const params = useParams();
  const { t } = useI18n();
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState("");
  const [isLoggedIn] = useState(true);

  const seedling = DUMMY_DETAIL;

  return (
    <main className="container-page py-8">
      <Link
        href="/seedlings"
        className="mb-4 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("seedlings.back") || "Kembali ke daftar"}
      </Link>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-3">
          <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-100 text-lg text-slate-400 dark:bg-slate-800">
            📷 {t("seedlings.mainPhoto") || "Foto Utama Bibit"}
          </div>
          <div className="flex gap-2">
            {Array.from({ length: PHOTO_COUNT }).map((_, i) => (
              <div
                key={i}
                className="flex h-20 w-24 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400 dark:bg-slate-800"
              >
                {t("seedlings.photo") || "Foto"} {i + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-bold text-ink">{seedling.species}</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-muted">{t("seedlings.count") || "Jumlah"}</span>
                <span className="font-semibold">{seedling.count} {t("seedlings.unit") || "bibit"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">{t("seedlings.available") || "Tersedia"}</span>
                <span className="font-semibold text-green-600">{seedling.available} {t("seedlings.unit") || "bibit"}</span>
              </div>
              <div className="flex items-center gap-1 text-ink-muted">
                <MapPin className="h-3.5 w-3.5" />
                {seedling.regency}, {seedling.province}
              </div>
              <div className="flex items-center gap-1 text-ink-muted">
                <User className="h-3.5 w-3.5" />
                {seedling.owner} · ⭐ {seedling.trustScore}
              </div>
              <div className="text-xs text-ink-subtle">
                {t("seedlings.reportedAt") || "Dilaporkan"} {seedling.createdAt}
              </div>
            </div>
          </div>

          {isLoggedIn && (
            <div className="card space-y-3">
              <h3 className="flex items-center gap-1 font-semibold text-ink">
                <Send className="h-4 w-4 text-brand-600" />
                {t("seedlings.sendRequest") || "Kirim Permintaan"}
              </h3>
              <div>
                <label className="text-xs text-ink-muted">{t("seedlings.quantity") || "Jumlah"}</label>
                <input
                  type="number"
                  value={qty}
                  min={1}
                  max={seedling.available}
                  onChange={e => setQty(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-ink-line px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-ink-muted">{t("seedlings.message") || "Pesan (opsional)"}</label>
                <textarea
                  value={message}
                  rows={3}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={t("seedlings.messagePlaceholder") || "Contoh: Mau tanam di kebun..."}
                  className="mt-1 w-full rounded-lg border border-ink-line px-3 py-2 text-sm"
                />
              </div>
              <button className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700">
                {t("seedlings.submitRequest") || "Kirim Permintaan"}
              </button>
            </div>
          )}

          {!isLoggedIn && (
            <div className="card py-4 text-center text-sm text-ink-muted">
              <Link href="/sign-in?redirect=/seedlings" className="font-medium text-brand-600 hover:underline">
                {t("seedlings.signInToRequest") || "Masuk"}
              </Link>
              {" "}{t("seedlings.signInToRequestHint") || "untuk mengirim permintaan"}
            </div>
          )}
        </div>
      </div>

      <div className="card mt-6">
        <h3 className="mb-2 font-semibold text-ink">{t("seedlings.notes") || "Keterangan"}</h3>
        <p className="text-sm text-ink-muted">{seedling.notes}</p>
      </div>
    </main>
  );
}
