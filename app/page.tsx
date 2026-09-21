import { Hero } from "@/components/sections/hero";
import { ImpactDashboard } from "@/components/sections/impact-dashboard";
import { SpringMap } from "@/components/sections/spring-map";
import { VolunteerActivities } from "@/components/sections/volunteer";
import { EventSchedule } from "@/components/sections/event-schedule";
import { FeaturedProjects } from "@/components/sections/featured-projects";
import { PartnerSection } from "@/_senior/components/PartnerSection";
import { LearningHub } from "@/components/sections/learning-hub";
import { RealActionHeader } from "@/components/sections/real-action-header";
import { MediaSection } from "@/components/sections/media";
import { DonateSection } from "@/components/sections/donate";
import { RiverFlow } from "@/components/sections/river-flow";
import { BkkCurve } from "@/components/sections/bkk-decor";
export default function HomePage() {
  return (
    <div id="river-main" className="relative">
      <RiverFlow />
      <Hero />
      <ImpactDashboard />
      <SpringMap />
      <VolunteerActivities />
      <EventSchedule />

      <section className="overflow-x-clip bg-transparent pt-16 md:pt-20 dark:bg-transparent">
        <div className="container-page">
        <RealActionHeader />

        <div className="mt-10 lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-12">
          <div className="lg:border-r lg:border-ink-line lg:pr-8 xl:pr-12">
            <FeaturedProjects />
          </div>
          <div className="lg:pl-8 xl:pl-12 lg:self-stretch">
            <DonateSection />
          </div>
        </div>
        </div>
        <BkkCurve top="bg-transparent" bottom="text-white dark:text-slate-900" accent="text-sky-200" />
      </section>

      <PartnerSection />
      <LearningHub />
      <MediaSection />
    </div>
  );
}
