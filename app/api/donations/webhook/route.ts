import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import { createHash, timingSafeEqual } from "crypto";
import type { DonationStatus } from "@prisma/client";
import { webhookLimiter } from "@/lib/rate-limit";

/**
 * Xendit webhook handler for payment status notifications.
 *
 * Verifies callback using the x-callback-token header via constant-time
 * comparison. When XENDIT_WEBHOOK_TOKEN is not configured the webhook is
 * rejected outright — except in staging (NEXT_PUBLIC_STAGING=true) where
 * the payload is accepted and logged for testing.
 *
 * Docs: https://developers.xendit.co/api-reference/#webhooks
 */
export async function POST(request: Request) {
  try {
    // Rate limit webhook — cegah flood
    const ip = request.headers.get("x-forwarded-for") || "webhook";
    const limiter = await webhookLimiter.check(`webhook:${ip}`);
    if (!limiter.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN;

    if (!expectedToken) {
      if (process.env.NEXT_PUBLIC_STAGING === "true") {
        console.warn("XENDIT_WEBHOOK_TOKEN tidak diset — menerima webhook (staging log-only)");
      } else {
        console.error("XENDIT_WEBHOOK_TOKEN tidak diset — menolak webhook");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      const token = request.headers.get("x-callback-token") || "";
      const tokenHash = createHash("sha256").update(token).digest();
      const expectedHash = createHash("sha256").update(expectedToken).digest();
      if (!timingSafeEqual(tokenHash, expectedHash)) {
        console.warn("Invalid webhook callback token");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json();
    const safeLog = { id: body.id, external_id: body.external_id, status: body.status };
    console.log("Xendit webhook received:", JSON.stringify(safeLog));

    const { id, external_id, status, paid_at } = body;

    if (!id && !external_id) {
      return NextResponse.json({ error: "Missing invoice id" }, { status: 400 });
    }

    const statusMap: Record<string, string> = {
      PAID: "paid",
      SETTLED: "paid",
      EXPIRED: "expired",
      FAILED: "failed",
    };

    const localStatus = statusMap[status];
    if (!localStatus) {
      console.log("Unhandled Xendit status:", status, "for invoice:", id);
      return NextResponse.json({ success: true, status: "ignored" });
    }

    // ── Idempotency check ──
    // Xendit may send duplicate webhooks. Check if already processed.
    const existing = await prisma.donation.findFirst({
      where: external_id
        ? { OR: [{ invoiceId: id || "" }, { externalId: external_id }] }
        : { invoiceId: id },
      select: { id: true, status: true, projectId: true, amountIdr: true, userId: true, donorName: true, donorEmail: true, tierId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    // If already paid, skip (idempotent)
    if (existing.status === "paid") {
      return NextResponse.json({ success: true, status: "already_processed" });
    }

    // ── Atomic compare-and-set: only one concurrent webhook wins ──
    const claimed = await prisma.$transaction(async (tx) => {
      const cas = await tx.donation.updateMany({
        where: {
          id: existing.id,
          status: localStatus === "paid" ? { not: "paid" } : "pending",
        },
        data: {
          status: localStatus as DonationStatus,
          paidAt: paid_at ? new Date(paid_at) : localStatus === "paid" ? new Date() : null,
        },
      });

      if (cas.count !== 1) return false;

      // If payment succeeded, award points and update project
      if (localStatus === "paid" && existing.userId) {
        // Award 1 point per Rp1,000 donated
        const pointsAwarded = Math.floor(existing.amountIdr / 1000);
        await tx.profile.update({
          where: { id: existing.userId },
          data: { points: { increment: pointsAwarded } },
        });

        await tx.pointsLog.create({
          data: {
            userId: existing.userId,
            reportId: null,
            amount: pointsAwarded,
            reason: `donasi Rp${existing.amountIdr.toLocaleString("id-ID")}`,
            metadata: JSON.stringify({ invoiceId: id, donationId: existing.id }),
          },
        });

        // Notifikasi admin ada donasi baru
        const admins = await tx.profile.findMany({
          where: { role: "admin" },
          select: { id: true },
        });
        for (const admin of admins) {
          await tx.notification.create({
            data: {
              userId: admin.id,
              type: "donation",
              title: `Donasi baru: Rp${existing.amountIdr.toLocaleString("id-ID")}`,
              body: `Donasi dari ${existing.donorName || existing.donorEmail || "anonim"} — ${existing.tierId || "Tanpa tier"}`,
              link: "/admin/donations",
            },
          });
        }

        // Update project raised amount if this is a project-specific donation
        if (existing.projectId) {
          await tx.project.update({
            where: { id: existing.projectId },
            data: { raisedAmount: { increment: existing.amountIdr } },
          });
        }
      }

      return true;
    });

    if (!claimed) {
      return NextResponse.json({ success: true, status: "already_processed" });
    }

    console.log(`Donation ${localStatus} — processed ${existing.id}`);

    return NextResponse.json({ success: true, updated: true });
  } catch (error) {
    console.error("Webhook error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}