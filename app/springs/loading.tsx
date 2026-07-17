import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function SpringsListLoading() {
  return (
    <div className="container-page py-12 space-y-8">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-5 w-72" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
