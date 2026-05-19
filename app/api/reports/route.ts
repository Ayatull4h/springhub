import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getGuestId } from "@/lib/guest";
import {
  formSchemaMap,
  getForm,
} from "@/lib/forms";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { snapToProtectionGrid } from "@/lib/geo";
import { verifyCsrfToken } from "@/lib/csrf";

/**
 * Rate limiter: simple in-memory tracking with periodic cleanup.
 * Note: In production, use Upstash / Vercel KV for distributed rate limiting.
 */
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_REQUESTS = 10; // max requests per window
const RATE_LIMIT_WINDOW_MS = 60_000; // per minute
const DAILY_FORM_LIMIT = 5; // per user

// Cleanup expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimits.entries()) {
    if (now > entry.resetAt) rateLimits.delete(key);
  }
}, 5 * 60 * 1000);

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_REQUESTS) return false;
  entry.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    // CSRF check
    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const session = await getSession();
    const guestId = getGuestId();
    const rateKey = session?.userId ?? guestId;

    // Rate limit check
    if (!checkRateLimit(rateKey)) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const formSlug = formData.get("form_slug") as string;

    if (!formSlug || !getForm(formSlug)) {
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
        preciseLat = parseFloat(value as string);
        fieldData[key] = value as string;
        continue;
      }
      if (key === "location_lng" || key.endsWith("_lng")) {
        preciseLng = parseFloat(value as string);
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
    let dynamicForm: any = null;
    try {
      dynamicForm = await (prisma as any).form.findUnique({
        where: { slug: formSlug },
        include: { fields: true },
      });
    } catch {
      // Form table may not exist yet — fall back to static schema
    }

    if (dynamicForm) {
      const fields = dynamicForm.fields.map((f: any) => ({
        fieldId: f.fieldId,
        label: f.label,
        type: f.type,
        required: f.required,
        options: (() => { try { return JSON.parse(f.options); } catch { return []; } })(),
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

    // Check daily limit for authenticated users
    if (session?.userId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayCount = await prisma.report.count({
        where: {
          userId: session.userId,
          createdAt: { gte: today, lt: tomorrow },
        },
      });

      if (todayCount >= DAILY_FORM_LIMIT) {
        return NextResponse.json(
          { error: "Batas laporan harian (5) tercapai. Coba lagi besok." },
          { status: 429 }
        );
      }
    }

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
    console.error("Report submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** GET /api/reports — list public reports (snapped location only). Supports ?limit=N */
export async function GET(request?: Request) {
  try {
    const url = request ? new URL(request.url) : null;
    const limitParam = url?.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const reports = await prisma.report.findMany({
      where: { status: "approved" },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        formSlug: true,
        status: true,
        snappedLat: true,
        snappedLng: true,
        createdAt: true,
        user: {
          select: { username: true, region: true },
        },
      },
    });

    const total = reports.length;
    const healthy = reports.filter(
      (r) => r.formSlug === "spring-monitoring" || r.formSlug === "seedling-stock"
    ).length;
    const restoration = reports.filter(
      (r) =>
        r.formSlug === "spring-restoration" ||
        r.formSlug === "trench-development" ||
        r.formSlug === "tree-planting"
    ).length;
    const degraded = total - healthy - restoration;

    return NextResponse.json({ reports, stats: { total, healthy, restoration, degraded } });
  } catch (error) {
    console.error("Reports fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
