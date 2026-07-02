import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

export default function CourseModuleLoading() {
  return (
    <div className="container-page py-12 space-y-8">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-96 w-full rounded-xl" />
      <SkeletonText lines={8} />
    </div>
  );
}
