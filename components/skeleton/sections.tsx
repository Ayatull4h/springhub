import { Skeleton, SkeletonCard, SkeletonStatCard, SkeletonMap, SkeletonText } from "@/components/ui/skeleton";

/** Landing page — Hero section */
export function HeroSkeleton() {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center bg-ink/5 dark:bg-ink/10">
      <div className="container-page text-center space-y-6 py-20">
        <Skeleton className="mx-auto h-12 w-3/4 max-w-2xl" />
        <Skeleton className="mx-auto h-6 w-2/3 max-w-xl" />
        <div className="flex justify-center gap-4 pt-4">
          <Skeleton className="h-12 w-40 rounded-full" />
          <Skeleton className="h-12 w-40 rounded-full" />
        </div>
      </div>
    </section>
  );
}

/** Landing page — Impact Dashboard (4 stat cards) */
export function ImpactDashboardSkeleton() {
  return (
    <section className="py-16">
      <div className="container-page">
        <Skeleton className="mx-auto mb-10 h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Landing page — Spring Map */
export function SpringMapSkeleton() {
  return (
    <section className="py-16">
      <div className="container-page">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="mb-8 h-5 w-72" />
        <SkeletonMap className="h-[400px] w-full rounded-xl" />
      </div>
    </section>
  );
}

/** Landing page — Volunteer Activities (activity cards) */
export function VolunteerActivitiesSkeleton() {
  return (
    <section className="py-16">
      <div className="container-page">
        <Skeleton className="mx-auto mb-2 h-8 w-56" />
        <Skeleton className="mx-auto mb-10 h-5 w-80" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Landing page — Learning Hub */
export function LearningHubSkeleton() {
  return (
    <section className="py-16">
      <div className="container-page">
        <Skeleton className="mx-auto mb-10 h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Landing page — Media Section */
export function MediaSectionSkeleton() {
  return (
    <section className="py-16">
      <div className="container-page">
        <Skeleton className="mb-2 h-8 w-40" />
        <Skeleton className="mb-10 h-5 w-60" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-line overflow-hidden">
              <Skeleton className="h-48 w-full rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Spring Detail page skeleton */
export function SpringDetailSkeleton() {
  return (
    <div className="container-page py-16 space-y-8">
      {/* Back button */}
      <Skeleton className="h-5 w-24" />
      {/* Title + badges */}
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
        </div>
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      {/* Mini map */}
      <SkeletonMap className="h-[300px] w-full rounded-xl" />
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      {/* Description */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <SkeletonText lines={5} />
      </div>
    </div>
  );
}

/** Admin Dashboard skeleton */
export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      {/* Table */}
      <div className="rounded-xl border border-line p-4 space-y-3">
        <Skeleton className="h-6 w-40" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

/** Profile page skeleton */
export function ProfileSkeleton() {
  return (
    <div className="container-page py-16 space-y-8">
      {/* Profile header */}
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>
      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      {/* Activity list */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-36" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/** Projects list page skeleton */
export function ProjectsListSkeleton() {
  return (
    <div className="container-page py-16 space-y-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-5 w-72" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function FeaturedProjectsSkeleton() {
  return (
    <section className="bg-gradient-to-b from-emerald-50 to-white py-20 dark:from-emerald-950/50 dark:to-slate-900">
      <div className="container-page text-center">
        <Skeleton className="mx-auto h-8 w-48" />
        <Skeleton className="mx-auto mt-3 h-5 w-72" />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Form page skeleton */
export function FormSkeleton() {
  return (
    <div className="container-page py-16 space-y-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-5 w-80" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  );
}

/** Learn page skeleton */
export function LearnSkeleton() {
  return (
    <div className="container-page py-16 space-y-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-5 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

/** Notifications page skeleton */
export function NotificationsSkeleton() {
  return (
    <div className="container-page py-16 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
