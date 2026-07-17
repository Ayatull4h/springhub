-- Migration: Add featuredPhotoId to Report table
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "featuredPhotoId" TEXT;

-- Add index for photo lookups
CREATE INDEX IF NOT EXISTS idx_report_featuredPhotoId ON "Report"("featuredPhotoId");
