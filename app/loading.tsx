import { HeroSkeleton, ImpactDashboardSkeleton, SpringMapSkeleton, VolunteerActivitiesSkeleton, FeaturedProjectsSkeleton, LearningHubSkeleton, MediaSectionSkeleton } from "@/components/skeleton";

export default function HomeLoading() {
  return (
    <>
      <HeroSkeleton />
      <ImpactDashboardSkeleton />
      <SpringMapSkeleton />
      <VolunteerActivitiesSkeleton />
      <FeaturedProjectsSkeleton />
      <LearningHubSkeleton />
      <MediaSectionSkeleton />
    </>
  );
}
