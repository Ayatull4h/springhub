import { Hero } from "@/components/sections/hero";
import { ImpactDashboard } from "@/components/sections/impact-dashboard";
import { SpringMap } from "@/components/sections/spring-map";
import { VolunteerActivities } from "@/components/sections/volunteer";
import { DonateSection } from "@/components/sections/donate";
import { PartnerSection } from "@/_senior/components/PartnerSection";
import { FeaturedProjects } from "@/_senior/components/FeaturedProjects";
import { LearningHub } from "@/components/sections/learning-hub";
import { MediaSection } from "@/components/sections/media";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ImpactDashboard />
      <SpringMap />
      <VolunteerActivities />
      <section className="container-page py-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <DonateSection />
          <FeaturedProjects />
        </div>
      </section>
      <PartnerSection />
      <LearningHub />
      <MediaSection />
    </>
  );
}
