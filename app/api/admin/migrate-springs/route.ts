import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const reports = await prisma.report.findMany({
      where: { status: "approved" },
      orderBy: { createdAt: "asc" },
    });

    const springMap = new Map<string, string>();
    let created = 0;

    for (const report of reports) {
      let fieldData: Record<string, unknown> = {};
      try { fieldData = JSON.parse(report.fieldData); } catch { continue; }

      const springName = (fieldData?.spring_name as string || "").trim();
      if (!springName || !report.snappedLat || !report.snappedLng) continue;

      const key = `${report.snappedLat.toFixed(3)}_${report.snappedLng.toFixed(3)}_${springName.toLowerCase()}`;

      if (!springMap.has(key)) {
        const spring = await prisma.spring.create({
          data: {
            name: springName,
            snappedLat: report.snappedLat,
            snappedLng: report.snappedLng,
            province: (fieldData?.province as string) || "",
            regency: (fieldData?.regency as string) || "",
            village: (fieldData?.village as string) || "",
            subdistrict: (fieldData?.subdistrict as string) || "",
          },
        });
        springMap.set(key, spring.id);
        created++;
      }

      await prisma.report.update({
        where: { id: report.id },
        data: { springId: springMap.get(key) },
      });
    }

    return NextResponse.json({
      success: true,
      reportsProcessed: reports.length,
      springsCreated: created,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}
