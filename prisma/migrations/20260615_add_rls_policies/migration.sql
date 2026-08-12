-- Migration: Add RLS policies for Spring, Comment, Notification + fix admin policies
-- Idempotent: aman di-run berkali-kali (DROP IF EXISTS + CREATE)
--
-- ⚠️ VPS FIX (2026-08-12): Supabase-only auth.uid()/auth.role() diganti dengan
--    current_setting('springhub.user_id', true) agar migration bisa di-run di
--    vanilla PostgreSQL (Hostinger VPS). Nilai GUC di-set oleh aplikasi via
--    SET LOCAL sebelum query (superuser tetap BYPASSRLS — lihat 20260812_add_rls_policies).

-- ═══════════════════════════════════════════════════════════════
-- 1. Enable RLS on missing tables
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE "Spring" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- 2. Spring policies
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Publik lihat spring" ON "Spring";
CREATE POLICY "Publik lihat spring" ON "Spring"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Volunteer insert spring" ON "Spring";
CREATE POLICY "Volunteer insert spring" ON "Spring"
  FOR INSERT WITH CHECK (current_setting('springhub.user_id', true) IS NOT NULL);

DROP POLICY IF EXISTS "Admin semua spring" ON "Spring";
CREATE POLICY "Admin semua spring" ON "Spring"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "Profile" WHERE id = current_setting('springhub.user_id', true) AND role = 'admin')
  );

-- ═══════════════════════════════════════════════════════════════
-- 3. Notification policies
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "User lihat notif sendiri" ON "Notification";
CREATE POLICY "User lihat notif sendiri" ON "Notification"
  FOR SELECT USING (current_setting('springhub.user_id', true) = "userId");

DROP POLICY IF EXISTS "User update notif sendiri" ON "Notification";
CREATE POLICY "User update notif sendiri" ON "Notification"
  FOR UPDATE USING (current_setting('springhub.user_id', true) = "userId");

DROP POLICY IF EXISTS "Admin semua notif" ON "Notification";
CREATE POLICY "Admin semua notif" ON "Notification"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "Profile" WHERE id = current_setting('springhub.user_id', true) AND role = 'admin')
  );

-- ═══════════════════════════════════════════════════════════════
-- 4. Comment policies
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Publik lihat comment" ON "Comment";
CREATE POLICY "Publik lihat comment" ON "Comment"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "User insert comment" ON "Comment";
CREATE POLICY "User insert comment" ON "Comment"
  FOR INSERT WITH CHECK (current_setting('springhub.user_id', true) = "userId");

DROP POLICY IF EXISTS "User update comment sendiri" ON "Comment";
CREATE POLICY "User update comment sendiri" ON "Comment"
  FOR UPDATE USING (current_setting('springhub.user_id', true) = "userId");

DROP POLICY IF EXISTS "User delete comment sendiri" ON "Comment";
CREATE POLICY "User delete comment sendiri" ON "Comment"
  FOR DELETE USING (current_setting('springhub.user_id', true) = "userId");

DROP POLICY IF EXISTS "Admin semua comment" ON "Comment";
CREATE POLICY "Admin semua comment" ON "Comment"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "Profile" WHERE id = current_setting('springhub.user_id', true) AND role = 'admin')
  );

-- ═══════════════════════════════════════════════════════════════
-- 5. Fix Feedback policy — ganti OR condition dengan 2 policy terpisah
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "User insert feedback" ON "Feedback";

DROP POLICY IF EXISTS "Auth insert feedback" ON "Feedback";
CREATE POLICY "Auth insert feedback" ON "Feedback"
  FOR INSERT WITH CHECK (
    current_setting('springhub.user_id', true) IS NOT NULL
    AND "userId" = current_setting('springhub.user_id', true)
    AND "status" = 'open'
  );

DROP POLICY IF EXISTS "Anon insert feedback" ON "Feedback";
CREATE POLICY "Anon insert feedback" ON "Feedback"
  FOR INSERT WITH CHECK (
    current_setting('springhub.user_id', true) IS NULL
    AND "userId" IS NULL
    AND "status" = 'open'
  );

-- ═══════════════════════════════════════════════════════════════
-- 6. Fix semua admin policy — ganti auth.role() = 'admin' (tdk pernah match)
--    dengan subquery ke Profile.role
-- ═══════════════════════════════════════════════════════════════

-- Profile
DROP POLICY IF EXISTS "Admin akses semua profile" ON "Profile";
CREATE POLICY "Admin akses semua profile" ON "Profile"
  FOR ALL USING (EXISTS (SELECT 1 FROM "Profile" WHERE id = current_setting('springhub.user_id', true) AND role = 'admin'));

-- Report
DROP POLICY IF EXISTS "Admin akses semua report" ON "Report";
CREATE POLICY "Admin akses semua report" ON "Report"
  FOR ALL USING (EXISTS (SELECT 1 FROM "Profile" WHERE id = current_setting('springhub.user_id', true) AND role = 'admin'));

-- Donation
DROP POLICY IF EXISTS "Admin akses semua donation" ON "Donation";
CREATE POLICY "Admin akses semua donation" ON "Donation"
  FOR ALL USING (EXISTS (SELECT 1 FROM "Profile" WHERE id = current_setting('springhub.user_id', true) AND role = 'admin'));

-- Project
DROP POLICY IF EXISTS "Admin akses semua project" ON "Project";
CREATE POLICY "Admin akses semua project" ON "Project"
  FOR ALL USING (EXISTS (SELECT 1 FROM "Profile" WHERE id = current_setting('springhub.user_id', true) AND role = 'admin'));

-- PointsLog
DROP POLICY IF EXISTS "Admin akses semua points" ON "PointsLog";
CREATE POLICY "Admin akses semua points" ON "PointsLog"
  FOR ALL USING (EXISTS (SELECT 1 FROM "Profile" WHERE id = current_setting('springhub.user_id', true) AND role = 'admin'));

-- Feedback
DROP POLICY IF EXISTS "Admin akses semua feedback" ON "Feedback";
CREATE POLICY "Admin akses semua feedback" ON "Feedback"
  FOR ALL USING (EXISTS (SELECT 1 FROM "Profile" WHERE id = current_setting('springhub.user_id', true) AND role = 'admin'));

-- Course
DROP POLICY IF EXISTS "Admin akses semua course" ON "Course";
CREATE POLICY "Admin akses semua course" ON "Course"
  FOR ALL USING (EXISTS (SELECT 1 FROM "Profile" WHERE id = current_setting('springhub.user_id', true) AND role = 'admin'));

-- CourseModule
DROP POLICY IF EXISTS "Admin akses semua module" ON "CourseModule";
CREATE POLICY "Admin akses semua module" ON "CourseModule"
  FOR ALL USING (EXISTS (SELECT 1 FROM "Profile" WHERE id = current_setting('springhub.user_id', true) AND role = 'admin'));

-- CoursesProgress
DROP POLICY IF EXISTS "Admin akses semua progress" ON "CoursesProgress";
CREATE POLICY "Admin akses semua progress" ON "CoursesProgress"
  FOR ALL USING (EXISTS (SELECT 1 FROM "Profile" WHERE id = current_setting('springhub.user_id', true) AND role = 'admin'));

-- Form
DROP POLICY IF EXISTS "Admin akses semua form" ON "Form";
CREATE POLICY "Admin akses semua form" ON "Form"
  FOR ALL USING (EXISTS (SELECT 1 FROM "Profile" WHERE id = current_setting('springhub.user_id', true) AND role = 'admin'));

-- FormField
DROP POLICY IF EXISTS "Admin akses semua field" ON "FormField";
CREATE POLICY "Admin akses semua field" ON "FormField"
  FOR ALL USING (EXISTS (SELECT 1 FROM "Profile" WHERE id = current_setting('springhub.user_id', true) AND role = 'admin'));

-- PointRule
DROP POLICY IF EXISTS "Admin akses semua point rules" ON "PointRule";
CREATE POLICY "Admin akses semua point rules" ON "PointRule"
  FOR ALL USING (EXISTS (SELECT 1 FROM "Profile" WHERE id = current_setting('springhub.user_id', true) AND role = 'admin'));

-- OfflineSession & TrackingPoint dibuat via `prisma db push` (tanpa migration).
-- Guard: hanya buat policy jika tabel sudah ada, supaya `migrate deploy` aman
-- di database baru (VPS vanilla Postgres).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'OfflineSession') THEN
    DROP POLICY IF EXISTS "Admin akses semua session" ON "OfflineSession";
    CREATE POLICY "Admin akses semua session" ON "OfflineSession"
      FOR ALL USING (EXISTS (SELECT 1 FROM "Profile" WHERE id = current_setting('springhub.user_id', true) AND role = 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'TrackingPoint') THEN
    DROP POLICY IF EXISTS "Admin akses semua tracking point" ON "TrackingPoint";
    CREATE POLICY "Admin akses semua tracking point" ON "TrackingPoint"
      FOR ALL USING (EXISTS (SELECT 1 FROM "Profile" WHERE id = current_setting('springhub.user_id', true) AND role = 'admin'));
  END IF;
END $$;

-- Admin semua report (inline policy)
DROP POLICY IF EXISTS "Admin semua report" ON "Report";
CREATE POLICY "Admin semua report" ON "Report"
  FOR ALL USING (EXISTS (SELECT 1 FROM "Profile" WHERE id = current_setting('springhub.user_id', true) AND role = 'admin'));
