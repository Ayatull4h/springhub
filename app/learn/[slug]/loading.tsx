import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

export default function CourseDetailLoading() {
  return (
    <div className="container-page py-12 space-y-8">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-5 w-96" />
      <div className="grid gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6 space-y-3">
            <Skeleton className="h-6 w-48" />
            <SkeletonText lines={2} />
          </div>
        ))}
      </div>
    </div>
  );
}
