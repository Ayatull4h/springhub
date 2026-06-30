import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.springhub.id";

  // Static pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${baseUrl}/springs`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${baseUrl}/projects`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.7 },
    { url: `${baseUrl}/learn`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.6 },
    { url: `${baseUrl}/sign-in`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.4 },
    { url: `${baseUrl}/join`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.4 },
    { url: `${baseUrl}/help`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.2 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.2 },
  ];

  // Dynamic: Springs
  let springPages: MetadataRoute.Sitemap = [];
  try {
    const springs = await prisma.spring.findMany({
      select: { id: true, name: true, updatedAt: true },
    });
    springPages = springs.map((s) => ({
      url: `${baseUrl}/springs/${s.id}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch (e) {
    console.error("[sitemap] Error fetching springs:", e instanceof Error ? e.message : e);
  }

  // Dynamic: Projects (approved or completed)
  let projectPages: MetadataRoute.Sitemap = [];
  try {
    const projects = await prisma.project.findMany({
      where: { status: { in: ["approved", "completed"] } },
      select: { id: true, title: true, updatedAt: true },
    });
    projectPages = projects.map((p) => ({
      url: `${baseUrl}/projects/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch (e) {
    console.error("[sitemap] Error fetching projects:", e instanceof Error ? e.message : e);
  }

  // Dynamic: Courses
  let coursePages: MetadataRoute.Sitemap = [];
  try {
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      select: { slug: true, title: true, updatedAt: true },
    });
    coursePages = courses.map((c) => ({
      url: `${baseUrl}/learn/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));
  } catch (e) {
    console.error("[sitemap] Error fetching courses:", e instanceof Error ? e.message : e);
  }

  return [...staticPages, ...springPages, ...projectPages, ...coursePages];
}
