-- ============================================================
-- SPRINGHUB — STORAGE SETUP
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Create the "photos" bucket (public, max 10 MB, jpeg/png/webp only)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
SELECT 'photos', 'photos', true, false, 10485760, '{image/jpeg,image/png,image.webp}'
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'photos');

-- 2. Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Public read access (anyone can view images)
DROP POLICY IF EXISTS "Public read photos" ON storage.objects;
CREATE POLICY "Public read photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

-- 4. Authenticated users & guests can upload
DROP POLICY IF EXISTS "Upload photos" ON storage.objects;
CREATE POLICY "Upload photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'photos'
    AND (auth.role() = 'authenticated' OR auth.role() = 'anon')
  );

-- 5. Users can update/delete their own files
DROP POLICY IF EXISTS "Update delete own photos" ON storage.objects;
CREATE POLICY "Update delete own photos" ON storage.objects
  FOR ALL USING (
    bucket_id = 'photos'
    AND (auth.uid()::text = owner_id OR owner_id IS NULL)
  );
