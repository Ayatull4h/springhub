import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getGuestId } from "@/lib/guest";
import { buildPhotoUrl } from "@/lib/photo-url";
import {
  formSchemaMap,
  getForm,
} from "@/lib/forms";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { snapToProtectionGrid } from "@/lib/geo";
import { verifyCsrfToken } from "@/lib/csrf";

import { apiLimiter } from "@/lib/rate-limit";
const GUEST_DAILY_LIMIT = 5; // guest only — volunteer & admin unlimited

export async function POST(request: Request) {
  try {
    // CSRF check — QueueWorker bypass (custom header gak bisa dikirim cross-origin tanpa preflight)
    const isQueueWorker = request.headers.get("x-queue-worker") === "true";

    if (!isQueueWorker) {
      const csrfToken = request.headers.get("x-csrf-token");
      if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
        return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
      }
    }

    const session = await getSession();
    const guestId = getGuestId();
    const rateKey = session?.userId ?? guestId;

    // Rate limit check
    const limitResult = await apiLimiter.check(`report:${rateKey}`);
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const formSlug = formData.get("form_slug") as string;

    if (!formSlug) {
      return NextResponse.json(
        { error: "Form tidak dikenal" },
        { status: 400 }
      );
    }

    // Try dynamic form from DB first
    const dbForm = await prisma.form.findUnique({ where: { slug: formSlug } }).catch(() => null);
    const staticForm = getForm(formSlug);

    if (!dbForm && !staticForm) {
      return NextResponse.json(
        { error: "Form tidak dikenal" },
        { status: 400 }
      );
    }

    // --- Anti-spam: Time Gate ---
    // If form was submitted too fast (<3 seconds from page load), reject
    const submitTime = formData.get("_submit_time") as string;
    if (submitTime) {
      const parsedTime = parseInt(submitTime, 10);
      if (!isNaN(parsedTime)) {
        const elapsed = Date.now() - parsedTime;
        if (elapsed < 3000) {
          return NextResponse.json(
            { error: "Terlalu cepat. Silakan isi formulir dengan benar." },
            { status: 429 }
          );
        }
      }
    }

    // --- Anti-spam: Honeypot ---
    const honeypot = formData.get("_website") as string;
    if (honeypot) {
      // Bot filled the hidden field — silently accept but don't save
      return NextResponse.json({ success: true, honeypot: true });
    }

    // Parse field data from form
    const fieldData: Record<string, unknown> = {};
    let preciseLat: number | null = null;
    let preciseLng: number | null = null;

    // Get the form schema to know which fields exist
    const schema = formSchemaMap[formSlug];
    const shape = schema?.shape ?? {};
    const fieldKeys = Object.keys(shape);

    for (const [key, value] of formData.entries()) {
      if (key === "form_slug" || key === "_submit_time" || key === "_website") continue;

      // Handle location fields
      if (key === "location_lat" || key.endsWith("_lat")) {
        const parsed = parseFloat(value as string);
        if (isNaN(parsed) || parsed < -90 || parsed > 90) {
          return NextResponse.json(
            { error: `Latitude tidak valid: ${value as string}. Harus antara -90 dan 90.` },
            { status: 400 }
          );
        }
        preciseLat = parsed;
        fieldData[key] = value as string;
        continue;
      }
      if (key === "location_lng" || key.endsWith("_lng")) {
        const parsed = parseFloat(value as string);
        if (isNaN(parsed) || parsed < -180 || parsed > 180) {
          return NextResponse.json(
            { error: `Longitude tidak valid: ${value as string}. Harus antara -180 dan 180.` },
            { status: 400 }
          );
        }
        preciseLng = parsed;
        fieldData[key] = value as string;
        continue;
      }

      // Handle multi-select (comes as array)
      if (key.endsWith("[]")) {
        const cleanKey = key.slice(0, -2);
        const existing = fieldData[cleanKey];
        if (Array.isArray(existing)) {
          existing.push(value as string);
        } else if (existing) {
          fieldData[cleanKey] = [existing, value as string];
        } else {
          fieldData[cleanKey] = [value as string];
        }
        continue;
      }

      fieldData[key] = value as string;
    }

    // Snap location to 5km protection grid
    let snappedLat: number | null = null;
    let snappedLng: number | null = null;
    if (preciseLat !== null && preciseLng !== null) {
      const snapped = snapToProtectionGrid({ lat: preciseLat, lng: preciseLng });
      snappedLat = snapped.lat;
      snappedLng = snapped.lng;
    }

    // Try dynamic form validation from DB first
    let dynamicForm: { fields: { fieldId: string; label: string; type: string; required: boolean; options: string | null }[] } | null = null;
    try {
      const result = await prisma.form.findUnique({
        where: { slug: formSlug },
        include: { fields: true },
      });
      if (result) {
        dynamicForm = {
          fields: result.fields.map((f) => ({
            fieldId: f.fieldId,
            label: f.label,
            type: f.type,
            required: f.required,
            options: f.options,
          })),
        };
      }
    } catch {
      // Form table may not exist yet — fall back to static schema
    }

    if (dynamicForm) {
      const fields = dynamicForm.fields.map((f) => ({
        fieldId: f.fieldId,
        label: f.label,
        type: f.type,
        required: f.required,
        options: (() => { try { return JSON.parse(f.options || "[]"); } catch { return []; } })(),
      }));
      const { generateZodSchema } = await import("@/lib/dynamic-validation");
      const dynSchema = generateZodSchema(fields);
      const dynParsed = dynSchema.safeParse(fieldData);
      if (!dynParsed.success) {
        return NextResponse.json(
          { error: "Validasi gagal", details: dynParsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
    } else if (schema) {
      const parsed = schema.safeParse(fieldData);
      if (!parsed.success) {
        return NextResponse.json(
          {
            error: "Validasi gagal",
            details: parsed.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }
    }

    // Check trust score block for authenticated users
    if (session?.userId) {
      const profile = await prisma.profile.findUnique({
        where: { id: session.userId },
        select: { trustScore: true },
      });
      if (profile && profile.trustScore !== null && profile.trustScore <= 0) {
        return NextResponse.json(
          { error: "Akun Anda diblokir karena skor kepercayaan rendah. Hubungi admin." },
          { status: 403 }
        );
      }
    }

    // Daily limit: guest max 5/hari, volunteer & admin unlimited
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (!session?.userId && guestId) {
      const todayCount = await prisma.report.count({
        where: {
          guestId: guestId,
          userId: null,
          createdAt: { gte: today, lt: tomorrow },
        },
      });
      if (todayCount >= GUEST_DAILY_LIMIT) {
        return NextResponse.json(
          { error: "Batas laporan harian (5) untuk guest tercapai. Daftar jadi volunteer untuk lapor tanpa batas!" },
          { status: 429 }
        );
      }
    }
    // Volunteer & admin: no daily limit

    // Create the report
    const report = await prisma.report.create({
      data: {
        userId: session?.userId ?? null,
        guestId: session?.userId ? null : guestId,
        formSlug,
        status: session?.userId ? "pending" : "pending",
        fieldData: JSON.stringify(fieldData),
        preciseLat,
        preciseLng,
        snappedLat,
        snappedLng,
      },
    });

    // ── Link or create Spring ────────────────────────────────────────
    const springName = (fieldData?.spring_name as string || "").trim();
    if (springName && formSlug !== "trench-development" && formSlug !== "seedling-stock") {
      try {
        // Cari spring yang cocok: snapped location match + nama mirip
        const existingSpring = snappedLat && snappedLng ? await prisma.spring.findFirst({
          where: {
            snappedLat: { gte: snappedLat - 0.001, lte: snappedLat + 0.001 },
            snappedLng: { gte: snappedLng - 0.001, lte: snappedLng + 0.001 },
            name: { contains: springName, mode: "insensitive" },
          },
        }) : null;

        if (existingSpring) {
          // Link ke spring yang sudah ada
          await prisma.report.update({
            where: { id: report.id },
            data: { springId: existingSpring.id },
          });
        } else {
          // Buat spring baru
          const newSpring = await prisma.spring.create({
            data: {
              name: springName,
              snappedLat,
              snappedLng,
              province: (fieldData?.province as string) || "",
              regency: (fieldData?.regency as string) || "",
              village: (fieldData?.village as string) || "",
              subdistrict: (fieldData?.subdistrict as string) || "",
            },
          });
          await prisma.report.update({
            where: { id: report.id },
            data: { springId: newSpring.id },
          });
        }
      } catch (e) {
        console.warn("[Spring] Link error:", e);
        // Non-critical — report tetap tersimpan walau tanpa springId
      }
    }

    // ── Buat Seedling dari form seedling ─────────────────────────────
    const species = (fieldData?.species as string || "").trim();
    const seedlingCount = parseInt((fieldData?.count as string || "0"), 10);
    if (species && seedlingCount > 0 && formSlug.includes("seedling")) {
      try {
        // Cari seedling yang sama (user + species + province), tambah stok
        const existing = await prisma.seedling.findFirst({
          where: {
            userId: session?.userId || "__guest__",
            species,
            province: (fieldData?.province as string) || "",
            status: { in: ["pending", "active"] },
          },
        });

        if (existing && existing.userId === session?.userId) {
          // User sama, species sama → tambah stok
          await prisma.seedling.update({
            where: { id: existing.id },
            data: {
              quantity: existing.quantity + seedlingCount,
              stock: existing.stock + seedlingCount,
            },
          });
        } else {
          // Bikin seedling baru
          await prisma.seedling.create({
            data: {
              userId: session?.userId || "__guest__",
              species,
              quantity: seedlingCount,
              stock: seedlingCount,
              province: (fieldData?.province as string) || "",
              regency: (fieldData?.regency as string) || "",
              notes: (fieldData?.notes as string) || "",
              status: "pending",
            },
          });
        }
      } catch (e) {
        console.warn("[Seedling] Creation error:", e);
        // Non-critical — report tetap tersimpan
      }
    }

    // NOTE: Points are NOT awarded here — they are awarded server-side
    // when an admin approves the report (see app/api/admin/reports/[id]/approve/route.ts).
    // This prevents double-awarding.

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        formSlug: report.formSlug,
        status: report.status,
      },
    });
  } catch (error) {
    console.error("Report submission error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}

/** GET /api/reports — list public reports (snapped location only). Supports ?limit=N */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit") || url.searchParams.get("per_page") || "50";
    const pageParam = url.searchParams.get("page") || "1";
    const limit = Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 200);
    const page = Math.max(parseInt(pageParam, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const where = {
      status: "approved" as const,
      isActive: true,
      form: { isActive: true },
    };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        select: {
          id: true,
          formSlug: true,
          status: true,
          snappedLat: true,
          snappedLng: true,
          springId: true,
          createdAt: true,
          featuredPhotoId: true,
          photos: {
            select: { id: true, storagePath: true },
            take: 1,
            orderBy: { createdAt: "desc" },
          },
          user: {
            select: { username: true, region: true },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);
    const healthy = reports.filter(
      (r: { formSlug: string }) => r.formSlug === "spring-monitoring" || r.formSlug === "seedling-stock"
    ).length;
    const restoration = reports.filter(
      (r: { formSlug: string }) =>
        r.formSlug === "spring-restoration" ||
        r.formSlug === "trench-development" ||
        r.formSlug === "tree-planting"
    ).length;
    const degraded = total - healthy - restoration;

    // Enrich reports with featured photo URL
    const enriched = reports.map((r: { featuredPhotoId: string | null; photos: { id: string; storagePath: string }[] }) => ({
      ...r,
      photoUrl: r.featuredPhotoId
        ? buildPhotoUrl(r.photos.find(p => p.id === r.featuredPhotoId)?.storagePath || "")
        : r.photos.length > 0
        ? buildPhotoUrl(r.photos[0].storagePath)
        : null,
    }));

    return NextResponse.json({
      reports: enriched,
      stats: { total, healthy, restoration, degraded },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Reports fetch error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
