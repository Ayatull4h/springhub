import { Hero } from "@/components/sections/hero";
import { ImpactDashboard } from "@/components/sections/impact-dashboard";
import { SpringMap } from "@/components/sections/spring-map";
import { VolunteerActivities } from "@/components/sections/volunteer";
import { PartnerSection } from "@/_senior/components/PartnerSection";
import { LearningHub } from "@/components/sections/learning-hub";
import { MediaSection } from "@/components/sections/media";
import { DonateSection } from "@/components/sections/donate";
import { ActivitiesCard } from "@/_senior/components/ActivitiesCard";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ImpactDashboard />
      <SpringMap />
      <VolunteerActivities />
      <div className="container-page py-8">
        <div className="grid gap-6 lg:grid-cols-12">
          <ActivitiesCard />
        </div>
      </div>
      <PartnerSection />
      <LearningHub />
      <MediaSection />
      <DonateSection />
    </>
  );
}
