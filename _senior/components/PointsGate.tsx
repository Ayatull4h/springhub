"use client";
import { useState } from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck, Lock, Info } from "lucide-react";
import { PROJECT_PROPOSAL_THRESHOLD } from "@/lib/data";
import { PointsGuideModal } from "@/components/sections/points-guide-modal";

export function PointsGate({ points }: { points: number }) {
  const [show, setShow] = useState(false);
  const eligible = points >= PROJECT_PROPOSAL_THRESHOLD;
  const pct = Math.min(100, Math.round((points / PROJECT_PROPOSAL_THRESHOLD) * 100));

  return (
    <div className="card flex flex-col bg-gradient-to-br from-brand-50 to-white lg:col-span-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Ajukan Project</h3>
        <span className={`chip ${eligible ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
          {eligible ? "✅ Eligible" : "🔒 Terkunci"}
        </span>
      </div>

      <div className="mt-4 rounded-lg border bg-white p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">Poin kamu</span>
          <span className="text-ink-muted">{points.toLocaleString()} / {PROJECT_PROPOSAL_THRESHOLD.toLocaleString()}</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1 text-ink-muted"><ShieldCheck className="h-3 w-3 text-emerald-500" /> Direview admin</span>
          <button onClick={() => setShow(true)} className="flex items-center gap-1 text-brand-600"><Info className="h-3 w-3" /> Cara Dapat Poin</button>
        </div>
      </div>

      {eligible ? (
        <Link href="/projects/new" className="btn-primary mt-5 w-full">Ajukan Project <span>→</span></Link>
      ) : (
        <button disabled className="mt-5 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-md bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500">
          <Lock className="h-4 w-4" /> Butuh {PROJECT_PROPOSAL_THRESHOLD.toLocaleString()} poin
        </button>
      )}

      <PointsGuideModal open={show} onClose={() => setShow(false)} />
    </div>
  );
}
