"use client";

import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { ActivitiesCard } from "./components/ActivitiesCard";
import { PointsGate } from "./components/PointsGate";
import { DonationCard } from "./components/DonationCard";
import { ImpactDashboard } from "@/components/sections/impact-dashboard";
import { useState, useEffect } from "react";

export default function SeniorLanding() {
  const [points, setPoints] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => { if (d.user) setPoints(d.user.points || 0); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  return (
    <>
      <Header />
      <HeroSection />
      <ImpactDashboard />
      <section className="container-page py-16">
        <h2 className="text-center text-3xl font-extrabold">Komunitas</h2>
        <div className="mt-10 grid gap-4 lg:grid-cols-12">
          <ActivitiesCard />
          {ready && <PointsGate points={points} />}
        </div>
      </section>
      <DonationCard />
      <footer className="border-t border-ink-line py-8 text-center text-xs text-ink-muted">
        Senior Version Preview — SpringHub
      </footer>
    </>
  );
}
