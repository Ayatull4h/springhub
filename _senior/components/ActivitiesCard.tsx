"use client";
import { useState } from "react";
import { recentActivities } from "@/lib/data";

const ITEMS_PER_PAGE = 2;

export function ActivitiesCard() {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(recentActivities.length / ITEMS_PER_PAGE));
  const visible = recentActivities.slice(0, page * ITEMS_PER_PAGE);

  return (
    <div className="lg:col-span-7">
      <h3 className="text-sm font-semibold">Aktivitas Terbaru</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {visible.map((a, i) => (
          <div key={i} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">{a.user}</p>
                <p className="text-xs text-ink-muted">{a.action}</p>
              </div>
              <span className="chip bg-brand-50 text-brand-700">+{a.points} pts</span>
            </div>
            <div className="mt-3 flex h-32 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
              {a.formSlug?.includes("monitoring") && <span className="text-3xl">👁️</span>}
              {a.formSlug?.includes("restoration") && <span className="text-3xl">🔧</span>}
              {a.formSlug?.includes("tree") && <span className="text-3xl">🌱</span>}
            </div>
            <p className="mt-2 text-xs text-ink-muted">{a.location} · {a.when}</p>
          </div>
        ))}
      </div>
      {recentActivities.length > ITEMS_PER_PAGE && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-md border px-3 py-1 text-xs disabled:opacity-30">←</button>
          <span className="text-xs text-ink-muted">{page}/{totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} className="rounded-md border px-3 py-1 text-xs disabled:opacity-30">→</button>
        </div>
      )}
    </div>
  );
}
