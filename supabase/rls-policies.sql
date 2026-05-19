-- ============================================================
-- SPRINGHUB — RLS POLICIES
-- Run this in Supabase Dashboard → SQL Editor
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

-- ─── PROFILES ────────────────────────────────────────────────
-- Publik: hanya lihat username, region, points
CREATE POLICY "Publik lihat username region points" ON "Profile"
  FOR SELECT USING (true);

-- User: bisa update profile sendiri
CREATE POLICY "User update sendiri" ON "Profile"
  FOR UPDATE USING (auth.uid()::text = id);

-- ─── REPORTS ─────────────────────────────────────────────────
-- Publik: lihat hanya snapped location, status approved
CREATE POLICY "Publik lihat approved reports" ON "Report"
  FOR SELECT USING (status = 'approved');

-- Volunteer: CRUD laporan sendiri
CREATE POLICY "Volunteer insert report" ON "Report"
  FOR INSERT WITH CHECK (auth.uid()::text = userId OR userId IS NULL);

CREATE POLICY "Volunteer lihat report sendiri" ON "Report"
  FOR SELECT USING (auth.uid()::text = userId);

CREATE POLICY "Volunteer update report sendiri" ON "Report"
  FOR UPDATE USING (auth.uid()::text = userId);

-- Admin: lihat semua
CREATE POLICY "Admin semua report" ON "Report"
  FOR ALL USING (auth.role() = 'admin');

-- ─── DONATIONS ───────────────────────────────────────────────
-- Publik: lihat donor_name, amount, status (hanya paid)
CREATE POLICY "Publik lihat donasi paid" ON "Donation"
  FOR SELECT USING (status = 'paid');

-- User: lihat donasi sendiri
CREATE POLICY "User lihat donasi sendiri" ON "Donation"
  FOR SELECT USING (auth.uid()::text = userId);

-- ─── PROJECTS ────────────────────────────────────────────────
-- Publik: lihat approved projects
CREATE POLICY "Publik lihat approved projects" ON "Project"
  FOR SELECT USING (status = 'approved');

-- Volunteer: insert project (if >= 20K pts)
-- NOTE: points check dilakukan di API, RLS hanya batasi akses
CREATE POLICY "Volunteer insert project" ON "Project"
  FOR INSERT WITH CHECK (auth.uid()::text = userId);

CREATE POLICY "Volunteer lihat project sendiri" ON "Project"
  FOR SELECT USING (auth.uid()::text = userId);

-- ─── POINTS LOG ──────────────────────────────────────────────
-- User: lihat poin sendiri
CREATE POLICY "User lihat points log sendiri" ON "PointsLog"
  FOR SELECT USING (auth.uid()::text = userId);

-- ─── COURSES ──────────────────────────────────────────────────
-- Publik: lihat course active
CREATE POLICY "Publik lihat course aktif" ON "Course"
  FOR SELECT USING (isActive = true);

CREATE POLICY "Publik lihat module" ON "CourseModule"
  FOR SELECT USING (true);

CREATE POLICY "User manage progress" ON "CoursesProgress"
  FOR ALL USING (auth.uid()::text = userId);

-- ─── FORMS ────────────────────────────────────────────────────
CREATE POLICY "Publik lihat form aktif" ON "Form"
  FOR SELECT USING (isActive = true);

CREATE POLICY "Publik lihat field" ON "FormField"
  FOR SELECT USING (true);

-- ─── POINT RULES ──────────────────────────────────────────────
CREATE POLICY "Publik lihat point rules aktif" ON "PointRule"
  FOR SELECT USING (isActive = true);

-- ─── FEEDBACK ─────────────────────────────────────────────────
CREATE POLICY "User insert feedback" ON "Feedback"
  FOR INSERT WITH CHECK (true);

-- ─── ADMIN OVERRIDES ──────────────────────────────────────────
-- Admin bisa akses semua tabel
CREATE POLICY "Admin akses semua profile" ON "Profile" FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Admin akses semua report" ON "Report" FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Admin akses semua donation" ON "Donation" FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Admin akses semua project" ON "Project" FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Admin akses semua points" ON "PointsLog" FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Admin akses semua feedback" ON "Feedback" FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Admin akses semua course" ON "Course" FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Admin akses semua module" ON "CourseModule" FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Admin akses semua progress" ON "CoursesProgress" FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Admin akses semua form" ON "Form" FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Admin akses semua field" ON "FormField" FOR ALL USING (auth.role() = 'admin');
CREATE POLICY "Admin akses semua point rules" ON "PointRule" FOR ALL USING (auth.role() = 'admin');
