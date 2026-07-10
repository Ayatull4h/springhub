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

      <section className="container-page py-16">
        <h2 className="text-center text-3xl font-extrabold tracking-tight md:text-4xl">
          Aksi Nyata
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-ink-muted">
          Pantau dan danai langsung proyek restorasi mata air berbasis komunitas secara transparan
        </p>

        <div className="mt-10 lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-12">
          <div className="lg:border-r lg:border-ink-line lg:pr-8 xl:pr-12">
            <FeaturedProjects />
          </div>
          <div className="lg:pl-8 xl:pl-12 lg:self-stretch">
            <DonateSection />
          </div>
        </div>
      </section>

      <PartnerSection />
      <LearningHub />
      <MediaSection />
    </>
  );
}
