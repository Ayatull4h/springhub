-- Migration: DB hardening — indexes, unique invoiceId, PasswordResetToken, clientCorrelationId
-- 2026-08-12 (audit finding):
--   - Donation.invoiceId UNIQUE (webhook idempotency)
--   - Compound indexes untuk query admin/public paling umum
--   - PasswordResetToken (single-use reset token, auth agent)
--   - Report.clientCorrelationId (offline-sync idempotency, pwa agent)
-- Idempotent-friendly: data de-dup guard sebelum unique index.

-- ═══════════════════════════════════════════════════════════════
-- 1. Report.clientCorrelationId + index (offline sync idempotency)
-- ═══════════════════════════════════════════════════════════════
-- AlterTable
ALTER TABLE "Report" ADD COLUMN "clientCorrelationId" TEXT;

-- CreateIndex — UNIQUE (idempotency key untuk dedupe offline retry)
CREATE UNIQUE INDEX "Report_clientCorrelationId_key" ON "Report"("clientCorrelationId");
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- ═══════════════════════════════════════════════════════════════
-- 2. Donation — invoiceId UNIQUE + (status, createdAt)
-- ═══════════════════════════════════════════════════════════════
-- Guard: baris legacy dengan invoiceId '' (default) harus di-unik-kan dulu,
-- jika tidak, unique index akan gagal.
UPDATE "Donation"
SET "invoiceId" = 'inv-' || id
WHERE "invoiceId" IS NULL OR "invoiceId" = '';

-- CreateIndex
CREATE UNIQUE INDEX "Donation_invoiceId_key" ON "Donation"("invoiceId");
CREATE INDEX "Donation_status_createdAt_idx" ON "Donation"("status", "createdAt");

-- ═══════════════════════════════════════════════════════════════
-- 3. Project / PointsLog / Spring — compound indexes
-- ═══════════════════════════════════════════════════════════════
-- CreateIndex
CREATE INDEX "Project_status_createdAt_idx" ON "Project"("status", "createdAt");
CREATE INDEX "PointsLog_userId_createdAt_idx" ON "PointsLog"("userId", "createdAt");

-- Spring.status & kolom terkait dibuat historis via `prisma db push` (tidak ada
-- migration). Baseline-guard supaya `migrate deploy` (dan index di bawah) tetap
-- jalan di database baru — no-op jika kolom sudah ada (prod-copy).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SpringStatus') THEN
    CREATE TYPE "SpringStatus" AS ENUM ('pending', 'active', 'merged');
  END IF;
END $$;

ALTER TABLE "Spring" ADD COLUMN IF NOT EXISTS "status" "SpringStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "Spring" ADD COLUMN IF NOT EXISTS "healthScore" INTEGER;
ALTER TABLE "Spring" ADD COLUMN IF NOT EXISTS "healthStatus" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Spring" ADD COLUMN IF NOT EXISTS "lastSurveyedAt" TIMESTAMP(3);
ALTER TABLE "Spring" ADD COLUMN IF NOT EXISTS "isDummy" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Spring" ADD COLUMN IF NOT EXISTS "village" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Spring" ADD COLUMN IF NOT EXISTS "subdistrict" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "Spring_status_idx" ON "Spring"("status");

-- ═══════════════════════════════════════════════════════════════
-- 4. PasswordResetToken — single-use reset token (auth agent)
-- ═══════════════════════════════════════════════════════════════
-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_profileId_expiresAt_idx" ON "PasswordResetToken"("profileId", "expiresAt");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
