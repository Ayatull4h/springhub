import { Hero } from "@/components/sections/hero";
import { ImpactDashboard } from "@/components/sections/impact-dashboard";
import { SpringMap } from "@/components/sections/spring-map";
import { VolunteerActivities } from "@/components/sections/volunteer";
import { PartnerSection } from "@/_senior/components/PartnerSection";
import { LearningHub } from "@/components/sections/learning-hub";
import { MediaSection } from "@/components/sections/media";
import { DonateSection } from "@/components/sections/donate";
import dynamic from "next/dynamic";

const ActivitiesCard = dynamic(
  () => import("@/_senior/components/ActivitiesCard").then(m => ({ default: m.ActivitiesCard })),
  { ssr: false }
);

export default function HomePage() {
  return (
    <>
      <Hero />
      <ImpactDashboard />
      <SpringMap />
      <VolunteerActivities />
      <div className="container-page">
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
