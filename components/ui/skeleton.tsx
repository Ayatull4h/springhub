import { cn } from "@/lib/utils";

/**
 * Base Skeleton — pulsing placeholder for loading states.
 * Gunakan className untuk mengatur ukuran (w-, h-, rounded-, dll).
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-ink/10 dark:bg-ink/20",
        className
      )}
      aria-hidden="true"
    />
  );
}

// ─── Reusable layout helpers ─────────────────────────────────────────

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 && lines > 1 ? "w-3/4" : "w-full")}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-line p-5", className)} aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <SkeletonText lines={2} className="mt-4" />
    </div>
  );
}

export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-line p-4", className)} aria-hidden="true">
      <Skeleton className="mb-2 h-8 w-8" />
      <Skeleton className="h-7 w-1/2" />
      <Skeleton className="mt-1 h-4 w-3/4" />
    </div>
  );
}

export function SkeletonMap({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl bg-ink/5 dark:bg-ink/10",
        className ?? "h-[400px] w-full"
      )}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-2 text-ink-muted">
        <Skeleton className="h-12 w-12 rounded-full" />
        <span className="text-sm">Memuat peta...</span>
      </div>
    </div>
  );
}

export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-16 w-16" };
  return <Skeleton className={cn("rounded-full", sizeMap[size])} />;
}
