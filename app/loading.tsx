import { HeroSkeleton, ImpactDashboardSkeleton, SpringMapSkeleton, VolunteerActivitiesSkeleton, LearningHubSkeleton, MediaSectionSkeleton } from "@/components/skeleton";

export default function HomeLoading() {
  return (
    <>
      <HeroSkeleton />
      <ImpactDashboardSkeleton />
      <SpringMapSkeleton />
      <VolunteerActivitiesSkeleton />
      <LearningHubSkeleton />
      <MediaSectionSkeleton />
    </>
  );
}
