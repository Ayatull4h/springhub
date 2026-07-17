"use client";

import { Sprout, CheckCircle, XCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type RequestItem = {
  id: string;
  from: string;
  qty: number;
  message: string;
  status: "pending" | "approved" | "rejected" | "fulfilled";
  date: string;
};

type ListingItem = {
  id: string;
  species: string;
  count: number;
  requests: RequestItem[];
};

const DUMMY: ListingItem[] = [
  {
    id: "1",
    species: "Jati",
    count: 50,
    requests: [
      { id: "r1", from: "Budi", qty: 10, message: "Mau tanam di kebun", status: "pending", date: "2 hari lalu" },
      { id: "r2", from: "Sari", qty: 5, message: "Buat penghijauan RT", status: "approved", date: "1 hari lalu" },
      { id: "r3", from: "Doni", qty: 3, message: "Bibit buat kelompok tani", status: "fulfilled", date: "5 hari lalu" },
    ],
  },
  {
    id: "2",
    species: "Bambu Petung",
    count: 30,
    requests: [
      { id: "r4", from: "Rudi", qty: 8, message: "Mau nanam di pinggir sungai", status: "pending", date: "3 hari lalu" },
    ],
  },
  {
    id: "3",
    species: "Mahoni",
    count: 100,
    requests: [],
  },
];

export default function MyListingsPage() {
  const { t } = useI18n();

  return (
    <main className="container-page py-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-ink">
        <Sprout className="h-6 w-6 text-brand-600" />
        {t("seedlings.myListings") || "Bibitku"}
      </h1>

      <div className="space-y-6">
        {DUMMY.map(listing => (
          <div key={listing.id} className="card">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-ink">{listing.species}</h3>
                <p className="text-xs text-ink-muted">{listing.count} bibit dilaporkan</p>
              </div>
              <span className="chip bg-brand-50 text-brand-700 text-xs">
                {listing.requests.length} permintaan
              </span>
            </div>

            {listing.requests.length === 0 ? (
              <p className="border-t border-ink-line py-4 text-center text-sm text-ink-muted">
                {t("seedlings.noRequests") || "Belum ada permintaan untuk bibit ini"}
              </p>
            ) : (
              <div className="divide-y divide-ink-line border-t border-ink-line">
                {listing.requests.map(req => (
                  <div key={req.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink">{req.from}</span>
                        <span className="text-sm text-ink-muted">minta {req.qty} bibit</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          req.status === "pending"
                            ? "text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300"
                            : req.status === "approved"
                              ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300"
                              : req.status === "fulfilled"
                                ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300"
                                : "text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-300"
                        }`}>
                          {req.status === "pending" ? "Menunggu" : req.status === "approved" ? "Disetujui" : req.status === "fulfilled" ? "Selesai" : "Ditolak"}
                        </span>
                      </div>
                      {req.message && (
                        <p className="mt-0.5 text-xs italic text-ink-muted">"{req.message}"</p>
                      )}
                      <p className="mt-0.5 text-[10px] text-ink-subtle">{req.date}</p>
                    </div>

                    {req.status === "pending" && (
                      <div className="flex gap-2">
                        <button className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-700">
                          <CheckCircle className="h-3 w-3" />
                          Setujui
                        </button>
                        <button className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50">
                          <XCircle className="h-3 w-3" />
                          Tolak
                        </button>
                      </div>
                    )}
                    {req.status === "approved" && (
                      <button className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700">
                        <CheckCircle className="h-3 w-3" />
                        Tandai Selesai
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
