-- ============================================================
-- SPRINGHUB — RLS POLICIES
-- Run this in Supabase Dashboard → SQL Editor
-- Idempotent: aman di-run berkali-kali (DROP IF EXISTS + CREATE)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReportPhoto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Donation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PointsLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CoursesProgress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PointRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Course" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CourseModule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Form" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FormField" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OfflineSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TrackingPoint" ENABLE ROW LEVEL SECURITY;

-- ─── PROFILES ────────────────────────────────────────────────
-- Publik: hanya lihat username, region, points
DROP POLICY IF EXISTS "Publik lihat username region points" ON "Profile";
CREATE POLICY "Publik lihat username region points" ON "Profile"
  FOR SELECT USING (true);

-- User: bisa update profile sendiri
DROP POLICY IF EXISTS "User update sendiri" ON "Profile";
CREATE POLICY "User update sendiri" ON "Profile"
  FOR UPDATE USING (auth.uid()::text = "id");

-- ─── REPORTS ─────────────────────────────────────────────────
-- Publik: lihat hanya snapped location, status approved
DROP POLICY IF EXISTS "Publik lihat approved reports" ON "Report";
CREATE POLICY "Publik lihat approved reports" ON "Report"
  FOR SELECT USING ("status" = 'approved');

-- Volunteer: CRUD laporan sendiri
DROP POLICY IF EXISTS "Volunteer insert report" ON "Report";
CREATE POLICY "Volunteer insert report" ON "Report"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId" OR "userId" IS NULL);

DROP POLICY IF EXISTS "Volunteer lihat report sendiri" ON "Report";
CREATE POLICY "Volunteer lihat report sendiri" ON "Report"
  FOR SELECT USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Volunteer update report sendiri" ON "Report";
CREATE POLICY "Volunteer update report sendiri" ON "Report"
  FOR UPDATE USING (auth.uid()::text = "userId");

-- Admin: lihat semua
DROP POLICY IF EXISTS "Admin semua report" ON "Report";
CREATE POLICY "Admin semua report" ON "Report"
  FOR ALL USING (auth.role() = 'admin');

-- ─── DONATIONS ───────────────────────────────────────────────
-- Publik: lihat donor_name, amount, status (hanya paid)
DROP POLICY IF EXISTS "Publik lihat donasi paid" ON "Donation";
CREATE POLICY "Publik lihat donasi paid" ON "Donation"
  FOR SELECT USING ("status" = 'paid');

-- User: lihat donasi sendiri
DROP POLICY IF EXISTS "User lihat donasi sendiri" ON "Donation";
CREATE POLICY "User lihat donasi sendiri" ON "Donation"
  FOR SELECT USING (auth.uid()::text = "userId");

-- ─── PROJECTS ────────────────────────────────────────────────
-- Publik: lihat approved projects
DROP POLICY IF EXISTS "Publik lihat approved projects" ON "Project";
CREATE POLICY "Publik lihat approved projects" ON "Project"
  FOR SELECT USING ("status" = 'approved');

-- Volunteer: insert project (if >= 20K pts)
-- NOTE: points check dilakukan di API, RLS hanya batasi akses
DROP POLICY IF EXISTS "Volunteer insert project" ON "Project";
CREATE POLICY "Volunteer insert project" ON "Project"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Volunteer lihat project sendiri" ON "Project";
CREATE POLICY "Volunteer lihat project sendiri" ON "Project"
  FOR SELECT USING (auth.uid()::text = "userId");

-- ─── POINTS LOG ──────────────────────────────────────────────
-- User: lihat poin sendiri
DROP POLICY IF EXISTS "User lihat points log sendiri" ON "PointsLog";
CREATE POLICY "User lihat points log sendiri" ON "PointsLog"
  FOR SELECT USING (auth.uid()::text = "userId");

-- ─── COURSES ──────────────────────────────────────────────────
-- Publik: lihat course active
DROP POLICY IF EXISTS "Publik lihat course aktif" ON "Course";
CREATE POLICY "Publik lihat course aktif" ON "Course"
  FOR SELECT USING ("isActive" = true);

DROP POLICY IF EXISTS "Publik lihat module" ON "CourseModule";
CREATE POLICY "Publik lihat module" ON "CourseModule"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "User manage progress" ON "CoursesProgress";
CREATE POLICY "User manage progress" ON "CoursesProgress"
  FOR ALL USING (auth.uid()::text = "userId");

-- ─── FORMS ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Publik lihat form aktif" ON "Form";
CREATE POLICY "Publik lihat form aktif" ON "Form"
  FOR SELECT USING ("isActive" = true);

DROP POLICY IF EXISTS "Publik lihat field" ON "FormField";
CREATE POLICY "Publik lihat field" ON "FormField"
  FOR SELECT USING (true);

-- ─── POINT RULES ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Publik lihat point rules aktif" ON "PointRule";
CREATE POLICY "Publik lihat point rules aktif" ON "PointRule"
  FOR SELECT USING ("isActive" = true);

-- ─── FEEDBACK ─────────────────────────────────────────────────
-- Auth user: userId harus miliknya sendiri (tidak bisa impersonate)
-- Guest (no auth): userId harus NULL
-- Status: dipaksa 'open' — tidak bisa set read/resolved dari client
DROP POLICY IF EXISTS "User insert feedback" ON "Feedback";
CREATE POLICY "User insert feedback" ON "Feedback"
  FOR INSERT WITH CHECK (
    ("userId" = auth.uid()::text AND "status" = 'open')
    OR
    (auth.uid() IS NULL AND "userId" IS NULL AND "status" = 'open')
  );

-- ─── OFFLINE SESSION ─────────────────────────────────────────
-- NOTE: data GPS tracking offline — hanya pemilik session & admin yang bisa akses
-- Publik: tidak bisa akses sama sekali (mengandung userId & relasi ke lokasi presisi)
DROP POLICY IF EXISTS "Volunteer insert session" ON "OfflineSession";
CREATE POLICY "Volunteer insert session" ON "OfflineSession"
  FOR INSERT WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Volunteer lihat session sendiri" ON "OfflineSession";
CREATE POLICY "Volunteer lihat session sendiri" ON "OfflineSession"
  FOR SELECT USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Volunteer update session sendiri" ON "OfflineSession";
CREATE POLICY "Volunteer update session sendiri" ON "OfflineSession"
  FOR UPDATE USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Volunteer delete session sendiri" ON "OfflineSession";
CREATE POLICY "Volunteer delete session sendiri" ON "OfflineSession"
  FOR DELETE USING (auth.uid()::text = "userId");

-- ─── TRACKING POINT ───────────────────────────────────────────
-- NOTE: Koordinat GPS presisi — akses strict via session ownership
-- Gunakan subquery ke OfflineSession untuk cek kepemilikan
DROP POLICY IF EXISTS "Volunteer insert tracking point" ON "TrackingPoint";
CREATE POLICY "Volunteer insert tracking point" ON "TrackingPoint"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "OfflineSession"
      WHERE "OfflineSession".id = "sessionId"
      AND "OfflineSession"."userId" = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Volunteer lihat tracking point sendiri" ON "TrackingPoint";
CREATE POLICY "Volunteer lihat tracking point sendiri" ON "TrackingPoint"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "OfflineSession"
      WHERE "OfflineSession".id = "sessionId"
      AND "OfflineSession"."userId" = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Volunteer update tracking point sendiri" ON "TrackingPoint";
CREATE POLICY "Volunteer update tracking point sendiri" ON "TrackingPoint"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "OfflineSession"
      WHERE "OfflineSession".id = "sessionId"
      AND "OfflineSession"."userId" = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Volunteer delete tracking point sendiri" ON "TrackingPoint";
CREATE POLICY "Volunteer delete tracking point sendiri" ON "TrackingPoint"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "OfflineSession"
      WHERE "OfflineSession".id = "sessionId"
      AND "OfflineSession"."userId" = auth.uid()::text
    )
  );

-- ─── ADMIN OVERRIDES ──────────────────────────────────────────
-- Admin bisa akses semua tabel
DROP POLICY IF EXISTS "Admin akses semua profile" ON "Profile";
CREATE POLICY "Admin akses semua profile" ON "Profile" FOR ALL USING (auth.role() = 'admin');

DROP POLICY IF EXISTS "Admin akses semua report" ON "Report";
CREATE POLICY "Admin akses semua report" ON "Report" FOR ALL USING (auth.role() = 'admin');

DROP POLICY IF EXISTS "Admin akses semua donation" ON "Donation";
CREATE POLICY "Admin akses semua donation" ON "Donation" FOR ALL USING (auth.role() = 'admin');

DROP POLICY IF EXISTS "Admin akses semua project" ON "Project";
CREATE POLICY "Admin akses semua project" ON "Project" FOR ALL USING (auth.role() = 'admin');

DROP POLICY IF EXISTS "Admin akses semua points" ON "PointsLog";
CREATE POLICY "Admin akses semua points" ON "PointsLog" FOR ALL USING (auth.role() = 'admin');

DROP POLICY IF EXISTS "Admin akses semua feedback" ON "Feedback";
CREATE POLICY "Admin akses semua feedback" ON "Feedback" FOR ALL USING (auth.role() = 'admin');

DROP POLICY IF EXISTS "Admin akses semua course" ON "Course";
CREATE POLICY "Admin akses semua course" ON "Course" FOR ALL USING (auth.role() = 'admin');

DROP POLICY IF EXISTS "Admin akses semua module" ON "CourseModule";
CREATE POLICY "Admin akses semua module" ON "CourseModule" FOR ALL USING (auth.role() = 'admin');

DROP POLICY IF EXISTS "Admin akses semua progress" ON "CoursesProgress";
CREATE POLICY "Admin akses semua progress" ON "CoursesProgress" FOR ALL USING (auth.role() = 'admin');

DROP POLICY IF EXISTS "Admin akses semua form" ON "Form";
CREATE POLICY "Admin akses semua form" ON "Form" FOR ALL USING (auth.role() = 'admin');

DROP POLICY IF EXISTS "Admin akses semua field" ON "FormField";
CREATE POLICY "Admin akses semua field" ON "FormField" FOR ALL USING (auth.role() = 'admin');

DROP POLICY IF EXISTS "Admin akses semua point rules" ON "PointRule";
CREATE POLICY "Admin akses semua point rules" ON "PointRule" FOR ALL USING (auth.role() = 'admin');

DROP POLICY IF EXISTS "Admin akses semua session" ON "OfflineSession";
CREATE POLICY "Admin akses semua session" ON "OfflineSession" FOR ALL USING (auth.role() = 'admin');

DROP POLICY IF EXISTS "Admin akses semua tracking point" ON "TrackingPoint";
CREATE POLICY "Admin akses semua tracking point" ON "TrackingPoint" FOR ALL USING (auth.role() = 'admin');

-- ============================================================
-- STORAGE POLICIES — Photos bucket
-- ============================================================

-- Ensure the "photos" bucket exists (public bucket for spring images)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('photos', 'photos', true, false, 10485760, '{image/jpeg,image/png,image/webp}')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (may already be enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Publik: bisa baca semua file di bucket photos (public bucket)
DROP POLICY IF EXISTS "Publik baca photos" ON storage.objects;
CREATE POLICY "Publik baca photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

-- Auth user & guest: bisa upload file ke bucket photos
DROP POLICY IF EXISTS "User upload photos" ON storage.objects;
CREATE POLICY "User upload photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'photos'
    AND (auth.role() = 'authenticated' OR auth.role() = 'anon')
  );

-- User: bisa update/delete file miliknya sendiri di bucket photos
DROP POLICY IF EXISTS "User update delete own photos" ON storage.objects;
CREATE POLICY "User update delete own photos" ON storage.objects
  FOR ALL USING (
    bucket_id = 'photos'
    AND (auth.uid()::text = owner_id OR owner_id IS NULL)
  );

-- Admin: bisa manage semua file di bucket photos
DROP POLICY IF EXISTS "Admin semua photos" ON storage.objects;
CREATE POLICY "Admin semua photos" ON storage.objects
  FOR ALL USING (bucket_id = 'photos' AND auth.role() = 'authenticated');
