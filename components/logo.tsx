import { Droplets } from "lucide-react";

export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const text = tone === "dark" ? "text-ink" : "text-white";
  const sub = tone === "dark" ? "text-ink-subtle" : "text-white/60";
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
        <Droplets className="h-5 w-5" />
      </span>
      <div className="leading-tight">
        <div className={`text-base font-bold tracking-tight ${text}`}>
          SPRINGHUB
        </div>
        <div className={`text-[10px] font-medium uppercase tracking-wider ${sub}`}>
          by Jaga Semesta
        </div>
      </div>
    </div>
  );
}
