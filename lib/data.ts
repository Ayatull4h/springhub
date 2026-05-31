// Mock data for the SpringHub landing page. Replace with API/DB calls later.

import { snapToProtectionGrid, type LatLng } from "./geo";

/** Volunteers must reach this many points before they can propose a project. */
export const PROJECT_PROPOSAL_THRESHOLD = 20_000;

/** Stand-in for the signed-in user shown in the eligibility gate. */
export const currentUser = {
  name: "Maya Putri",
  region: "Yogyakarta",
  points: 24168,
};

/**
 * The only four kinds of project SpringHub will fund / publicise. Project
 * proposals must pick one of these — keeps impact reporting consistent and
 * lets us tie donations directly to verified outputs.
 */
export const PROJECT_TYPES = [
  {
    id: "tree_planting",
    label: "Endemic Tree Planting",
    summary: "Plant native species around a spring or its recharge area.",
  },
  {
    id: "trench_development",
    label: "Trench (Rorak) Development",
    summary: "Build infiltration trenches that recharge groundwater.",
  },
  {
    id: "spring_restoration",
    label: "Spring Restoration",
    summary: "Remove sediment and rehabilitate a degraded spring.",
  },
  {
    id: "monitoring_expedition",
    label: "Monitoring Expedition",
    summary: "Field expedition to inventory and assess springs.",
  },
] as const;

export type ProjectTypeId = (typeof PROJECT_TYPES)[number]["id"];

export const impactStats: Array<{
  label: string;
  value: number;
  display?: string;
  delta: string;
  icon: "droplet" | "sparkles" | "tree" | "layers";
}> = [
  { label: "Monitored Springs", value: 500, display: "500+", delta: "+12 this month", icon: "droplet" },
  { label: "Restored Springs", value: 30, display: "30+", delta: "+3 this month", icon: "sparkles" },
  { label: "Endemic Trees Planted", value: 20000, display: "20,000", delta: "+89 this month", icon: "tree" },
  { label: "Trenches", value: 150, display: "150", delta: "+12 this month", icon: "layers" },
];

export const monthlyProgress = [
  { label: "Springs Monitored", value: 12, total: 20, suffix: "now" },
  { label: "Trees Planted", value: 89, total: 120, suffix: "now" },
  { label: "New Volunteers", value: 45, total: 60, suffix: "joined" },
];

export const topRegions = [
  { rank: 1, name: "Jawa Barat", detail: "43 springs · 234 trees" },
  { rank: 2, name: "Bali", detail: "28 springs · 198 trees" },
  { rank: 3, name: "Jawa Tengah", detail: "21 springs · 165 trees" },
];

// Some volunteers cleared the proposal threshold (>20K), others haven't —
// makes the eligibility gate visible in the UI.
export const topVolunteers = [
  { rank: 1, name: "Maya Putri", region: "Yogyakarta", points: 24168 },
  { rank: 2, name: "Budi Santoso", region: "Jawa Tengah", points: 21858 },
  { rank: 3, name: "Sari Dewi", region: "Bali", points: 12580 },
];

export type SpringStatus = "healthy" | "degraded" | "restoration";

type SpringRecord = {
  id: string;
  name: string;
  region: string;
  status: SpringStatus;
  reports: number;
  lastReport: string;
  /** Precise coordinates — only released to admins / field leads. */
  precise: LatLng;
  /** Public-safe location, snapped to the 5 km protection grid. */
  publicLoc: LatLng;
};

const rawSprings: Omit<SpringRecord, "publicLoc">[] = [
  { id: "1", name: "Mata Air Cibeureum", region: "Bogor, Jawa Barat", status: "healthy", reports: 24, lastReport: "2 days ago", precise: { lat: -6.6447, lng: 106.7892 } },
  { id: "2", name: "Sumber Beratan", region: "Bedugul, Bali", status: "degraded", reports: 11, lastReport: "5 days ago", precise: { lat: -8.2750, lng: 115.1670 } },
  { id: "3", name: "Mata Air Sebatu", region: "Gianyar, Bali", status: "restoration", reports: 8, lastReport: "1 week ago", precise: { lat: -8.4231, lng: 115.2779 } },
  { id: "4", name: "Mata Air Umbul Ponggok", region: "Klaten, Jawa Tengah", status: "healthy", reports: 19, lastReport: "3 days ago", precise: { lat: -7.6891, lng: 110.6472 } },
  { id: "5", name: "Mata Air Cikahuripan", region: "Sukabumi, Jawa Barat", status: "healthy", reports: 14, lastReport: "1 day ago", precise: { lat: -6.9210, lng: 106.9270 } },
  { id: "6", name: "Mata Air Senjoyo", region: "Semarang, Jawa Tengah", status: "degraded", reports: 9, lastReport: "4 days ago", precise: { lat: -7.2389, lng: 110.5063 } },
];

export const springs: SpringRecord[] = rawSprings.map((s) => ({
  ...s,
  publicLoc: snapToProtectionGrid(s.precise),
}));

export const recentActivities = [
  {
    user: "Rini A.",
    action: "filed a Pemantauan Mata Air report",
    location: "Mata Air Cibeureum, Bogor",
    when: "2h ago",
    points: 25,
    likes: 24,
    comments: 6,
    formSlug: "spring-monitoring" as const,
  },
  {
    user: "Raya P.",
    action: "logged tree planting (12 endemic trees)",
    location: "Bedugul, Bali",
    when: "6h ago",
    points: 60,
    likes: 18,
    comments: 3,
    formSlug: "tree-planting" as const,
  },
  {
    user: "Agus W.",
    action: "completed Spring Conservation Basics course",
    location: "Yogyakarta",
    when: "1d ago",
    points: 25,
    likes: 8,
    comments: 1,
    formSlug: "spring-monitoring" as const,
  },
  {
    user: "Dewi S.",
    action: "logged seedling stock (200 bibit bambu)",
    location: "Klungkung, Bali",
    when: "2d ago",
    points: 15,
    likes: 12,
    comments: 2,
    formSlug: "seedling-stock" as const,
  },
];

export type ProjectStatus = "approved" | "under_review" | "rejected";

export const featuredProjects: Array<{
  title: string;
  region: string;
  summary: string;
  raised: number;
  goal: number;
  backers: number;
  typeId: ProjectTypeId;
  status: ProjectStatus;
}> = [
  {
    title: "Restore Cibeureum Spring",
    region: "Bogor, Jawa Barat",
    summary:
      "Sediment removal and riparian replanting around a degraded spring serving 200+ families.",
    raised: 18250000,
    goal: 25000000,
    backers: 142,
    typeId: "spring_restoration",
    status: "approved",
  },
  {
    title: "Endemic Tree Planting · Tabanan",
    region: "Tabanan, Bali",
    summary:
      "Plant 500 endemic trees in the recharge area of five sacred springs in central Bali.",
    raised: 9100000,
    goal: 15000000,
    backers: 87,
    typeId: "tree_planting",
    status: "approved",
  },
  {
    title: "Senjoyo Trench Network",
    region: "Semarang, Jawa Tengah",
    summary:
      "Submitted by Budi Santoso. Build 50 infiltration trenches around Mata Air Senjoyo to recharge the watershed.",
    raised: 0,
    goal: 18000000,
    backers: 0,
    typeId: "trench_development",
    status: "under_review",
  },
];

export type MediaItem = {
  type: "Event" | "Publication" | "Press" | "Video";
  title: string;
  date: string;
  summary: string;
  href: string;
  cta: string;
};

export const mediaItems: MediaItem[] = [
  {
    type: "Video",
    title: "Jaga Semesta · Restorasi Mata Air",
    date: "Apr 2026",
    summary:
      "Tonton perjalanan komunitas kami merestorasi mata air dari Bali sampai Madura.",
    href: "https://www.youtube.com/watch?v=oUDA1loE8BE",
    cta: "Watch on YouTube",
  },
  {
    type: "Event",
    title: "Restorasi Mata Air Sumber Sabrangan, Mojokerto",
    date: "9 Feb 2025 · 200 relawan · 5000 bibit bambu",
    summary:
      "Kegiatan kolektif membersihkan sedimen, memasang flowmeter, dan menanam 5000 bambu di catchment Sumber Sabrangan.",
    href: "/help",
    cta: "Read recap",
  },
  {
    type: "Publication",
    title: "Laporan Dampak 2025: 200+ Mata Air Terlindungi",
    date: "Jan 2026 · PDF, 36 hal.",
    summary:
      "Ringkasan capaian tahunan: pemantauan, restorasi, penanaman, dan kemitraan strategis di tujuh provinsi.",
    href: "/help",
    cta: "Download report",
  },
  {
    type: "Press",
    title: "Kompas: Sumber Air di Kebumen Diselamatkan Warga",
    date: "Jan 2026",
    summary:
      "Liputan media tentang gerakan warga Kebumen menolak tambang dan menjaga 28 titik mata air karst.",
    href: "/help",
    cta: "Read article",
  },
];

export const courses = [
  {
    title: "Spring Conservation Basics",
    level: "Beginner",
    duration: "45 min",
    modules: 6,
    summary:
      "Learn the fundamentals of spring ecosystems and conservation techniques used across Indonesia.",
  },
  {
    title: "Endemic Tree Planting Guide",
    level: "Intermediate",
    duration: "60 min",
    modules: 8,
    summary:
      "Master site-selection, planting, and care for Indonesia's native tree species in watershed areas.",
  },
  {
    title: "Field Reporting with SpringHub Forms",
    level: "Beginner",
    duration: "30 min",
    modules: 4,
    summary:
      "Walk through the four SpringHub forms — monitoring, restoration, seedling stock, and trench/tree tracker.",
  },
];
