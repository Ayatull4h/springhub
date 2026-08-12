-- Migration: Activate RLS on sensitive tables (Report, Profile)
-- 2026-08-12 (audit finding #5)
-- Idempotent: DROP IF EXISTS + CREATE.
--
-- ⚠️ Penting:
--   - RLS hanya mengikat koneksi NON-superuser. Koneksi superuser (BYPASSRLS)
--     yang dipakai aplikasi saat ini TIDAK terpengaruh — aman tanpa perubahan app.
--   - GUC "springhub.user_id" di-set oleh aplikasi per-request sebelum query:
--       SET LOCAL "springhub.user_id" = '<profileId | "admin">';
--     (tidak di-set / NULL = publik / anonymous)
--   - Kebijakan: admin melihat semua baris, pemilik melihat barisnya sendiri,
--     publik hanya melihat baris "aman" (Report: status='approved' AND isActive=true;
--     koordinat presisi tetap dipisah di lapisan aplikasi via lib/geo.ts).

ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama dari 20260615 yang masih memakai auth.uid()
-- agar tidak menimbulkan error saat dievaluasi di koneksi non-superuser.
DROP POLICY IF EXISTS "Admin akses semua report" ON "Report";
DROP POLICY IF EXISTS "Admin semua report" ON "Report";
DROP POLICY IF EXISTS "Admin akses semua profile" ON "Profile";

-- ═══════════════════════════════════════════════════════════════
-- Report policies
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Report publik lihat aman" ON "Report";
CREATE POLICY "Report publik lihat aman" ON "Report"
  FOR SELECT USING ("status" = 'approved' AND "isActive" = true);

DROP POLICY IF EXISTS "Report pemilik lihat sendiri" ON "Report";
CREATE POLICY "Report pemilik lihat sendiri" ON "Report"
  FOR SELECT USING ("userId" = current_setting('springhub.user_id', true));

DROP POLICY IF EXISTS "Report admin semua" ON "Report";
CREATE POLICY "Report admin semua" ON "Report"
  FOR ALL USING (
    current_setting('springhub.user_id', true) = 'admin'
    OR EXISTS (
      SELECT 1 FROM "Profile"
      WHERE id = current_setting('springhub.user_id', true) AND role = 'admin'
    )
  );

-- Login wajib untuk isi form (guest tidak submit report)
DROP POLICY IF EXISTS "Report insert terautentikasi" ON "Report";
CREATE POLICY "Report insert terautentikasi" ON "Report"
  FOR INSERT WITH CHECK (current_setting('springhub.user_id', true) IS NOT NULL);

DROP POLICY IF EXISTS "Report update pemilik" ON "Report";
CREATE POLICY "Report update pemilik" ON "Report"
  FOR UPDATE USING ("userId" = current_setting('springhub.user_id', true));

-- ═══════════════════════════════════════════════════════════════
-- Profile policies (email/phone sensitif — hanya pemilik & admin)
-- CATATAN: tidak boleh ada subquery SELECT dari "Profile" di dalam
-- policy Profile sendiri → infinite recursion (RLS). Admin memakai
-- konvensi GUC "springhub.user_id" = 'admin'.
-- ═══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Profile lihat sendiri" ON "Profile";
CREATE POLICY "Profile lihat sendiri" ON "Profile"
  FOR SELECT USING ("id" = current_setting('springhub.user_id', true));

DROP POLICY IF EXISTS "Profile admin semua" ON "Profile";
CREATE POLICY "Profile admin semua" ON "Profile"
  FOR ALL USING (current_setting('springhub.user_id', true) = 'admin');

DROP POLICY IF EXISTS "Profile update sendiri" ON "Profile";
CREATE POLICY "Profile update sendiri" ON "Profile"
  FOR UPDATE USING ("id" = current_setting('springhub.user_id', true));
