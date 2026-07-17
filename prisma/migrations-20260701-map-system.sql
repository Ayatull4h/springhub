-- ============================================================
-- MIGRASI: Map System Generalization
-- Tanggal: 1 Juli 2026
-- Tujuan: Menambahkan MapPointType, MapPointCategory, MapPoint
--         dan menghubungkan Form serta Report ke sistem map baru
-- ============================================================

-- 1. Buat MapPointTypes untuk form yang sudah ada
INSERT INTO "MapPointType" (id, slug, name, description, icon, "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'spring', 'Mata Air', 'Titik pemantauan mata air', 'Droplets', 1, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'tree-planting', 'Tanam Pohon', 'Lokasi penanaman pohon', 'TreePine', 2, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'trench', 'Parit Resapan', 'Lokasi pembuatan parit resapan', 'Trench', 3, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'seedling', 'Penyemaian', 'Lokasi persemaian bibit', 'Seedling', 4, true, NOW(), NOW()),
  (gen_random_uuid()::text, 'conservation', 'Konservasi', 'Area konservasi flora dan fauna', 'Leaf', 5, true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- 2. Buat kategori untuk tiap tipe
-- Spring categories
INSERT INTO "MapPointCategory" (id, "typeId", slug, name, color, "sortOrder", "createdAt")
SELECT gen_random_uuid()::text, id, 'sehat', 'Sehat', '#22c55e', 1, NOW() FROM "MapPointType" WHERE slug = 'spring'
WHERE NOT EXISTS (SELECT 1 FROM "MapPointCategory" WHERE slug = 'sehat' AND "typeId" = (SELECT id FROM "MapPointType" WHERE slug = 'spring'));

INSERT INTO "MapPointCategory" (id, "typeId", slug, name, color, "sortOrder", "createdAt")
SELECT gen_random_uuid()::text, id, 'terdegradasi', 'Terdegradasi', '#ef4444', 2, NOW() FROM "MapPointType" WHERE slug = 'spring'
WHERE NOT EXISTS (SELECT 1 FROM "MapPointCategory" WHERE slug = 'terdegradasi' AND "typeId" = (SELECT id FROM "MapPointType" WHERE slug = 'spring'));

INSERT INTO "MapPointCategory" (id, "typeId", slug, name, color, "sortOrder", "createdAt")
SELECT gen_random_uuid()::text, id, 'restorasi', 'Dalam Restorasi', '#f59e0b', 3, NOW() FROM "MapPointType" WHERE slug = 'spring'
WHERE NOT EXISTS (SELECT 1 FROM "MapPointCategory" WHERE slug = 'restorasi' AND "typeId" = (SELECT id FROM "MapPointType" WHERE slug = 'spring'));

-- Conservation categories (contoh untuk uji coba)
INSERT INTO "MapPointCategory" (id, "typeId", slug, name, color, "sortOrder", "createdAt")
SELECT gen_random_uuid()::text, id, 'pohon-hampir-punah', 'Pohon Hampir Punah', '#dc2626', 1, NOW() FROM "MapPointType" WHERE slug = 'conservation'
WHERE NOT EXISTS (SELECT 1 FROM "MapPointCategory" WHERE slug = 'pohon-hampir-punah' AND "typeId" = (SELECT id FROM "MapPointType" WHERE slug = 'conservation'));

INSERT INTO "MapPointCategory" (id, "typeId", slug, name, color, "sortOrder", "createdAt")
SELECT gen_random_uuid()::text, id, 'pohon-terkonservasi', 'Pohon Terkonservasi', '#16a34a', 2, NOW() FROM "MapPointType" WHERE slug = 'conservation'
WHERE NOT EXISTS (SELECT 1 FROM "MapPointCategory" WHERE slug = 'pohon-terkonservasi' AND "typeId" = (SELECT id FROM "MapPointType" WHERE slug = 'conservation'));

INSERT INTO "MapPointCategory" (id, "typeId", slug, name, color, "sortOrder", "createdAt")
SELECT gen_random_uuid()::text, id, 'ikan-hampir-punah', 'Ikan Hampir Punah', '#b91c1c', 3, NOW() FROM "MapPointType" WHERE slug = 'conservation'
WHERE NOT EXISTS (SELECT 1 FROM "MapPointCategory" WHERE slug = 'ikan-hampir-punah' AND "typeId" = (SELECT id FROM "MapPointType" WHERE slug = 'conservation'));

INSERT INTO "MapPointCategory" (id, "typeId", slug, name, color, "sortOrder", "createdAt")
SELECT gen_random_uuid()::text, id, 'ikan-terkonservasi', 'Ikan Terkonservasi', '#15803d', 4, NOW() FROM "MapPointType" WHERE slug = 'conservation'
WHERE NOT EXISTS (SELECT 1 FROM "MapPointCategory" WHERE slug = 'ikan-terkonservasi' AND "typeId" = (SELECT id FROM "MapPointType" WHERE slug = 'conservation'));

-- 3. Hubungkan Form ke MapPointType
UPDATE "Form" SET "mapTypeId" = (SELECT id FROM "MapPointType" WHERE slug = 'spring')
WHERE slug IN ('spring-monitoring', 'spring-restoration') AND "mapTypeId" IS NULL;

UPDATE "Form" SET "mapTypeId" = (SELECT id FROM "MapPointType" WHERE slug = 'tree-planting')
WHERE slug = 'tree-planting' AND "mapTypeId" IS NULL;

UPDATE "Form" SET "mapTypeId" = (SELECT id FROM "MapPointType" WHERE slug = 'trench')
WHERE slug = 'trench-development' AND "mapTypeId" IS NULL;

UPDATE "Form" SET "mapTypeId" = (SELECT id FROM "MapPointType" WHERE slug = 'seedling')
WHERE slug = 'seedling-stock' AND "mapTypeId" IS NULL;

-- 4. Buat MapPoint dari data Spring yang sudah ada
INSERT INTO "MapPoint" (id, "typeId", name, slug, "snappedLat", "snappedLng", province, regency, village, subdistrict, "isActive", "createdAt", "updatedAt")
SELECT
  s.id, -- reuse Spring ID
  (SELECT id FROM "MapPointType" WHERE slug = 'spring'),
  s.name,
  LOWER(REGEXP_REPLACE(s.name, '[^a-zA-Z0-9]+', '-', 'g')),
  s."snappedLat",
  s."snappedLng",
  s.province,
  s.regency,
  s.village,
  s.subdistrict,
  true,
  s."createdAt",
  NOW()
FROM "Spring" s
WHERE NOT EXISTS (SELECT 1 FROM "MapPoint" mp WHERE mp.id = s.id);

-- 5. Hubungkan laporan ke MapPoint
UPDATE "Report" SET "mapPointId" = "springId"
WHERE "springId" IS NOT NULL AND "mapPointId" IS NULL;

-- 6. Set kategori untuk MapPoint spring berdasarkan data laporan terakhir
-- (contoh sederhana: semua spring yang ada dimulai dengan kategori 'sehat')
UPDATE "MapPoint" mp
SET "categoryId" = (SELECT id FROM "MapPointCategory" WHERE slug = 'sehat' AND "typeId" = mp."typeId")
WHERE mp."typeId" = (SELECT id FROM "MapPointType" WHERE slug = 'spring')
  AND "categoryId" IS NULL;
