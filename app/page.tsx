import { Hero } from "@/components/sections/hero";
import { ImpactDashboard } from "@/components/sections/impact-dashboard";
import { SpringMap } from "@/components/sections/spring-map";
import { VolunteerActivities } from "@/components/sections/volunteer";
import { FeaturedProjects } from "@/components/sections/featured-projects";
import { PartnerSection } from "@/_senior/components/PartnerSection";
import { LearningHub } from "@/components/sections/learning-hub";
import { MediaSection } from "@/components/sections/media";
import { DonateSection } from "@/components/sections/donate";
export default function HomePage() {
  return (
    <>
      <Hero />
      <ImpactDashboard />
      <SpringMap />
      <VolunteerActivities />
      <PartnerSection />
      <LearningHub />
      <MediaSection />

      <section className="bg-slate-50/50 py-20 dark:bg-slate-900/40">
        <div className="container-page">
          <div className="lg:grid lg:grid-cols-2 lg:gap-10 xl:gap-16">
            <FeaturedProjects />
            <DonateSection />
          </div>
        </div>
      </section>
    </>
  );
}
