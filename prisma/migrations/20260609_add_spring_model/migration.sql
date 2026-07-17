-- CreateTable
CREATE TABLE "Spring" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "snappedLat" DOUBLE PRECISION,
    "snappedLng" DOUBLE PRECISION,
    "province" TEXT NOT NULL DEFAULT '',
    "regency" TEXT NOT NULL DEFAULT '',
    "village" TEXT NOT NULL DEFAULT '',
    "subdistrict" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Spring_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Spring_snappedLat_snappedLng_idx" ON "Spring"("snappedLat", "snappedLng");
CREATE INDEX "Spring_name_idx" ON "Spring"("name");

-- AlterTable: Add springId column
ALTER TABLE "Report" ADD COLUMN "springId" TEXT;
CREATE INDEX "Report_springId_idx" ON "Report"("springId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_springId_fkey" FOREIGN KEY ("springId") REFERENCES "Spring"("id") ON DELETE SET NULL ON UPDATE CASCADE;
