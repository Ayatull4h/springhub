import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

export default function SpringDetailLoading() {
  return (
    <div className="container-page py-12 space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-5 w-96" />
      <Skeleton className="h-[300px] w-full rounded-xl" />
      <div className="grid md:grid-cols-2 gap-6">
        <SkeletonText lines={5} />
        <SkeletonText lines={5} />
      </div>
    </div>
  );
}
