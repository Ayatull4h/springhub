import { NextResponse } from "next/server";
import { getSession, isAdmin as checkAdmin } from "@/lib/auth";
import { prisma, getErrorMessage } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import * as archiver from "archiver";
import fs from "fs";
import path from "path";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/data/uploads";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "spring";
}

// GET /api/admin/springs/:id/download — ZIP semua foto 1 mata air + data.csv (admin only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const spring = await prisma.spring.findUnique({
      where: { id },
      include: {
        reports: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            formSlug: true,
            status: true,
            createdAt: true,
            fieldData: true,
            photos: { orderBy: { createdAt: "asc" } },
          },
        },
      },
    });
    if (!spring) {
      return NextResponse.json({ error: "Spring tidak ditemukan" }, { status: 404 });
    }

    const photos = spring.reports.flatMap((r) =>
      r.photos.map((p) => ({ ...p, reportId: r.id, formSlug: r.formSlug }))
    );
    const localPhotos = photos.filter(
      (p) => !p.storagePath.startsWith("http://") && !p.storagePath.startsWith("https://")
    );

    const archive = archiver("zip", { zlib: { level: 6 } });
    const chunks: Buffer[] = [];
    const done = new Promise<void>((resolve, reject) => {
      archive.on("data", (c: Buffer) => chunks.push(c));
      archive.on("end", () => resolve());
      archive.on("error", (e: Error) => reject(e));
    });

    let attached = 0;
    for (const p of localPhotos) {
      const full = path.join(UPLOAD_DIR, p.storagePath);
      if (fs.existsSync(full)) {
        archive.file(full, { name: `foto/${path.basename(p.storagePath)}` });
        attached++;
      }
    }

    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      "report_id,form_slug,status,created_at,photo_id,filename",
      ...spring.reports.flatMap((r) =>
        r.photos.length
          ? r.photos.map((p) => [r.id, r.formSlug, r.status, r.createdAt.toISOString(), p.id, path.basename(p.storagePath)].map(esc).join(","))
          : [[r.id, r.formSlug, r.status, r.createdAt.toISOString(), "", ""].map(esc).join(",")]
      ),
    ].join("\n");
    archive.append(csv, { name: "data.csv" });
    archive.append(
      JSON.stringify({ spring: spring.name, province: spring.province, regency: spring.regency, reports: spring.reports.length, photos: photos.length, attached, exportedAt: new Date().toISOString() }, null, 2),
      { name: "info.json" }
    );

    await archive.finalize();
    await done;

    auditLog("spring download", `Download ZIP ${spring.name}: ${attached} foto`);

    return new Response(Buffer.concat(chunks), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${slugify(spring.name)}_${spring.reports.length}laporan_${attached}foto.zip"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Gagal membuat ZIP") },
      { status: 500 }
    );
  }
}
