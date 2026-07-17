"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FileText, X } from "lucide-react";
import { offlineDB, type DraftReport } from "@/lib/offline-db";

export function DraftBanner() {
  const [drafts, setDrafts] = useState<DraftReport[]>([]);
  const [dismissed, setDismissed] = useState(false);

  const refresh = useCallback(async () => {
    const all = await offlineDB.getAllDrafts();
    setDrafts(all);
  }, []);

  useEffect(() => {
    refresh();
    // Refresh every 30 seconds
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (drafts.length === 0 || dismissed) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-amber-600" />
          <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            Kamu punya {drafts.length} draft tersimpan
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-md p-1 text-amber-400 hover:bg-amber-100 hover:text-amber-600 dark:hover:bg-amber-800/30"
          aria-label="Tutup banner draft"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2 space-y-1">
        {drafts.map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-300"
          >
            <span>
              {d.formSlug.replace(/_/g, " ")} — {Object.keys(d.fieldData).length} field terisi
            </span>
            <Link
              href={`/report/${d.formSlug}`}
              className="font-semibold underline hover:text-amber-800 dark:hover:text-amber-100"
            >
              Lanjutkan
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
