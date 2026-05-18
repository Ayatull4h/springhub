import { Hero } from "@/components/sections/hero";
import { ImpactDashboard } from "@/components/sections/impact-dashboard";
import { SpringMap } from "@/components/sections/spring-map";
import { VolunteerActivities } from "@/components/sections/volunteer";
import { DonateSection } from "@/components/sections/donate";
import { LearningHub } from "@/components/sections/learning-hub";
import { MediaSection } from "@/components/sections/media";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ImpactDashboard />
      <SpringMap />
      <VolunteerActivities />
      <DonateSection />
      <LearningHub />
      <MediaSection />
    </>
  );
}
