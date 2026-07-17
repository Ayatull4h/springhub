import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

export default function DynamicPageLoading() {
  return (
    <div className="container-page py-12 space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-5 w-96" />
      <SkeletonText lines={12} />
    </div>
  );
}
