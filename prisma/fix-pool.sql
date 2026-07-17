-- =====================================================================
--  FIX: Supabase Connection Pool — Prevent EMAXCONNSESSION
--  Run this in Supabase Dashboard > SQL Editor
-- =====================================================================

-- 1. Terminate idle connections dari aplikasi (bukan Supabase sendiri)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE usename = 'postgres'
  AND state = 'idle'
  AND state_change < now() - interval '5 minutes'
  AND application_name NOT LIKE 'pgbouncer%'
  AND pid <> pg_backend_pid();

-- 2. Lihat sisa koneksi aktif (verifikasi)
SELECT count(*) AS active_connections
FROM pg_stat_activity
WHERE usename = 'postgres'
  AND state = 'active'
  AND pid <> pg_backend_pid();

-- 3. Lihat idle connections yang masih bertahan
SELECT count(*) AS idle_connections
FROM pg_stat_activity
WHERE usename = 'postgres'
  AND state = 'idle'
  AND pid <> pg_backend_pid();

-- 4. CATATAN: pool_size dan max_connections tidak bisa di-set via SQL di
--    Supabase (bukan parameter PostgreSQL standar). Konfigurasi pool
--    dilakukan via Dashboard > Database > Connection pool.

-- =====================================================================
--  AFTER RUNNING:
--  1. Jika masih muncul EMAXCONNSESSION, restart pool dari Dashboard:
--     Settings > Database > Reset connection pool (tunggu 1-2 menit)
--  2. Pastikan .env pakai ?pgbouncer=true
--  3. Redeploy Vercel (cold start) — force koneksi baru
-- =====================================================================
