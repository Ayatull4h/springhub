import { NextResponse } from "next/server";
import { prisma, getErrorMessage, isDatabaseError } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import type { DonationStatus } from "@prisma/client";
import { webhookLimiter } from "@/lib/rate-limit";
import { verifyMidtransSignature, type MidtransNotification } from "@/lib/midtrans";

/**
 * Midtrans webhook handler for payment status notifications.
 *
 * Security (all must pass):
 * 1. signature_key verified (SHA-512 constant-time) — rejects forged calls.
 * 2. gross_amount cross-checked against the stored donation row — rejects
 *    tampered amounts (e.g. pay Rp10.000 credited as Rp1.000.000).
 * 3. Rate-limited per IP; no secrets ever logged.
 *
 * Docs: https://docs.midtrans.com/docs/http-notification
 */
export async function POST(request: Request) {
  try {
    // Rate limit webhook — cegah flood
    const ip = request.headers.get("x-forwarded-for") || "webhook";
    const limiter = await webhookLimiter.check(`webhook:${ip}`);
    if (!limiter.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = (await request.json()) as MidtransNotification;
    const safeLog = {
      order_id: body.order_id,
      status_code: body.status_code,
      transaction_status: body.transaction_status,
    };
    console.log("Midtrans webhook received:", JSON.stringify(safeLog));

    // 1. Verifikasi signature — tanpa server key / mismatch = tolak
    if (!verifyMidtransSignature(body)) {
      console.warn("Invalid Midtrans signature for order:", body.order_id);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { order_id, transaction_status, fraud_status, payment_type, transaction_time } = body;

    if (!order_id) {
      return NextResponse.json({ error: "Missing order id" }, { status: 400 });
    }

    // ── Idempotency lookup ──
    const existing = await prisma.donation.findFirst({
      where: { OR: [{ invoiceId: order_id }, { externalId: order_id }] },
      select: { id: true, status: true, projectId: true, amountIdr: true, userId: true, donorName: true, donorEmail: true, tierId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    // 2. Cross-check nominal — tolak bila webhook bilang beda dari DB
    const notifiedAmount = parseInt(body.gross_amount || "", 10);
    if (!Number.isFinite(notifiedAmount) || notifiedAmount !== existing.amountIdr) {
      console.warn(
        `Amount mismatch for donation ${existing.id}: db=${existing.amountIdr} webhook=${body.gross_amount}`
      );
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    // If already paid, skip (idempotent)
    if (existing.status === "paid") {
      return NextResponse.json({ success: true, status: "already_processed" });
    }

    // Status mapping — capture hanya dihitung bila fraud lolos
    let localStatus: DonationStatus | null = null;
    if (transaction_status === "settlement") {
      localStatus = "paid";
    } else if (transaction_status === "capture") {
      localStatus = fraud_status === "challenge" ? null : "paid";
    } else if (transaction_status === "pending") {
      return NextResponse.json({ success: true, status: "pending" });
    } else if (transaction_status === "deny" || transaction_status === "cancel") {
      localStatus = "failed";
    } else if (transaction_status === "expire") {
      localStatus = "expired";
    }

    if (!localStatus) {
      console.log("Unhandled Midtrans status:", transaction_status, "for order:", order_id);
      return NextResponse.json({ success: true, status: "ignored" });
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
          paidAt: transaction_time ? new Date(transaction_time) : localStatus === "paid" ? new Date() : null,
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
            metadata: JSON.stringify({ orderId: order_id, donationId: existing.id, paymentType: payment_type || null }),
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

    console.log(`Donation ${localStatus} — processed ${existing.id} via Midtrans`);

    return NextResponse.json({ success: true, updated: true });
  } catch (error) {
    console.error("Webhook error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: getErrorMessage(error, "Terjadi kesalahan.") },
      { status: isDatabaseError(error) ? 503 : 500 }
    );
  }
}
