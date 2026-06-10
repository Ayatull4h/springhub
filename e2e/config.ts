// SpringHub E2E Test Configuration
export const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

export const TEST_USERS = {
  volunteer: { email: "volunteer@springhub.id", password: "vol12345" },
  admin: { email: "admin@springhub.id", password: "admin123" },
};

export const FORM_SLUGS = [
  "spring-monitoring",
  "spring-restoration",
  "trench-development",
  "tree-planting",
  "seedling-stock",
] as const;

export const ADMIN_ROUTES = [
  "/admin",
  "/admin/users",
  "/admin/reports",
  "/admin/donations",
  "/admin/projects",
  "/admin/review",
  "/admin/points",
  "/admin/courses",
] as const;

export const PUBLIC_ROUTES = [
  { path: "/", name: "Landing Page" },
  { path: "/sign-in", name: "Sign In" },
  { path: "/join", name: "Join" },
  { path: "/faq", name: "FAQ" },
  { path: "/help", name: "Help Center" },
  { path: "/privacy", name: "Privacy Policy" },
  { path: "/terms", name: "Terms of Service" },
  { path: "/not-found-test", name: "404 Test" },
  { path: "/forgot-password", name: "Forgot Password" },
  { path: "/report-issue", name: "Report Issue" },
  { path: "/learn/pengenalan-mata-air", name: "Course Detail" },
  { path: "/learn/pengenalan-mata-air/modul-1", name: "Course Module" },
] as const;

export const REPORT_ROUTES = FORM_SLUGS.map((s) => ({
  path: `/report/${s}`,
  slug: s,
}));
