-- Migration: Add isActive to Report table
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Add index for public queries
CREATE INDEX IF NOT EXISTS idx_report_isActive ON "Report"("isActive");
