-- ============================================================
-- Seed Dummy Data untuk SpringHub
-- Copy-paste ke Supabase SQL Editor dan jalankan
-- ============================================================

-- 1. User dummy (skip jika sudah ada)
INSERT INTO "Profile" (id, email, "passwordHash", username, role, points, "trustScore", region, phone, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'ucup@springhub.id', '$2b$10$CNLIfmN3EqcbUXf6NaCsZew.qE1RwgbTxGY3ImqosbaZ8krlJWKcm', 'Ucup', 'volunteer'::"Role", 25000, 90, 'Yogyakarta', '08123456789', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "Profile" WHERE email = 'ucup@springhub.id');

-- 2. Springs dummy (skip jika sudah ada nama yang sama)
INSERT INTO "Spring" (id, name, "snappedLat", "snappedLng", province, regency, village, subdistrict, "isDummy", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Mata Air Sumber Jalatunda', -7.2032, 109.8701, 'Jawa Tengah', 'Banjarnegara', 'Pekasiran', 'Batur', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "Spring" WHERE name = 'Mata Air Sumber Jalatunda');

INSERT INTO "Spring" (id, name, "snappedLat", "snappedLng", province, regency, village, subdistrict, "isDummy", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Mata Air Tuk Bening', -7.9528, 110.5367, 'DI Yogyakarta', 'Gunung Kidul', 'Plembutan', 'Playen', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "Spring" WHERE name = 'Mata Air Tuk Bening');

INSERT INTO "Spring" (id, name, "snappedLat", "snappedLng", province, regency, village, subdistrict, "isDummy", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Mata Air Sendang Biru', -8.3050, 112.6845, 'Jawa Timur', 'Malang', 'Sumbermanjing', 'Sumbermanjing Wetan', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "Spring" WHERE name = 'Mata Air Sendang Biru');

INSERT INTO "Spring" (id, name, "snappedLat", "snappedLng", province, regency, village, subdistrict, "isDummy", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Mata Air Cipamingkis', -6.6078, 107.0032, 'Jawa Barat', 'Bogor', 'Sukamakmur', 'Sukamakmur', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "Spring" WHERE name = 'Mata Air Cipamingkis');

INSERT INTO "Spring" (id, name, "snappedLat", "snappedLng", province, regency, village, subdistrict, "isDummy", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Mata Air Sumber Maron', -7.6321, 110.5678, 'Jawa Tengah', 'Klaten', 'Kemalang', 'Kemalang', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "Spring" WHERE name = 'Mata Air Sumber Maron');

INSERT INTO "Spring" (id, name, "snappedLat", "snappedLng", province, regency, village, subdistrict, "isDummy", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Mata Air Umbul Ponggok', -7.6150, 110.6740, 'Jawa Tengah', 'Klaten', 'Ponggok', 'Polanharjo', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "Spring" WHERE name = 'Mata Air Umbul Ponggok');

INSERT INTO "Spring" (id, name, "snappedLat", "snappedLng", province, regency, village, subdistrict, "isDummy", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Mata Air Sumberawan', -7.8701, 112.6543, 'Jawa Timur', 'Malang', 'Toyomarto', 'Singosari', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "Spring" WHERE name = 'Mata Air Sumberawan');

INSERT INTO "Spring" (id, name, "snappedLat", "snappedLng", province, regency, village, subdistrict, "isDummy", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Mata Air Curug Cimahi', -6.8821, 107.5423, 'Jawa Barat', 'Bandung Barat', 'Cimahi', 'Cimahi Selatan', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "Spring" WHERE name = 'Mata Air Curug Cimahi');

INSERT INTO "Spring" (id, name, "snappedLat", "snappedLng", province, regency, village, subdistrict, "isDummy", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Mata Air Sumber Gempong', -7.8213, 112.9876, 'Jawa Timur', 'Pasuruan', 'Wonorejo', 'Lumbang', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "Spring" WHERE name = 'Mata Air Sumber Gempong');

INSERT INTO "Spring" (id, name, "snappedLat", "snappedLng", province, regency, village, subdistrict, "isDummy", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Mata Air Tuk Sanga', -7.9210, 110.3892, 'DI Yogyakarta', 'Bantul', 'Sriharjo', 'Imogiri', true, now(), now()
WHERE NOT EXISTS (SELECT 1 FROM "Spring" WHERE name = 'Mata Air Tuk Sanga');

-- 3. Report dummy (25 laporan dengan data bervariasi)
DO $$
DECLARE
  ucup_id UUID;
  vol_id UUID;
  spring_data RECORD;
  form_slugs TEXT[] := ARRAY['spring-monitoring', 'spring-restoration', 'trench-development', 'tree-planting', 'seedling-stock'];
  selected_slug TEXT;
  villages TEXT[] := ARRAY['Sumberjo', 'Wonorejo', 'Sukamaju', 'Mulyosari', 'Argomulyo'];
  report_id UUID;
  status_val TEXT;
  pts INT;
  spring_name TEXT;
  spring_province TEXT;
  spring_regency TEXT;
  spring_lat DOUBLE PRECISION;
  spring_lng DOUBLE PRECISION;
  spring_pkey UUID;
  chosen_user UUID;
BEGIN
  SELECT id INTO ucup_id FROM "Profile" WHERE email = 'ucup@springhub.id';
  SELECT id INTO vol_id FROM "Profile" WHERE email = 'volunteer@springhub.id';
  
  IF ucup_id IS NULL THEN
    RAISE NOTICE 'User ucup@springhub.id tidak ditemukan. Jalankan seed utama dulu.';
    RETURN;
  END IF;

  FOR i IN 1..25 LOOP
    SELECT id, name, province, regency, "snappedLat", "snappedLng"
    INTO spring_pkey, spring_name, spring_province, spring_regency, spring_lat, spring_lng
    FROM "Spring" ORDER BY random() LIMIT 1;

    selected_slug := form_slugs[1 + floor(random() * array_length(form_slugs, 1))];
    IF random() < 0.7 THEN status_val := 'approved';
    ELSIF random() < 0.9 THEN status_val := 'pending';
    ELSE status_val := 'rejected';
    END IF;

    chosen_user := CASE WHEN random() < 0.6 THEN ucup_id ELSE COALESCE(vol_id, ucup_id) END;

    INSERT INTO "Report" (id, "userId", "formSlug", status, "isActive", "isDummy", "fieldData", "snappedLat", "snappedLng", "springId", "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(), chosen_user, selected_slug, status_val::"ReportStatus", true, true,
      CASE selected_slug
        WHEN 'spring-monitoring' THEN
          format('{"spring_name": "%s", "province": "%s", "regency": "%s", "village": "%s", "water_volume": "%s", "water_color": "%s", "water_temperature": "%s", "notes": "%s"}',
            spring_name, spring_province, spring_regency,
            villages[1 + floor(random() * 5)],
            CAST(floor(random() * 10 + 1) AS TEXT),
            (ARRAY['Bening', 'Kekuningan', 'Kecoklatan'])[1 + floor(random() * 3)],
            (ARRAY['Dingin', 'Sejuk', 'Normal', 'Hangat'])[1 + floor(random() * 4)],
            'Kondisi air masih baik, vegetasi sekitar rimbun.')
        WHEN 'spring-restoration' THEN
          format('{"spring_name": "%s", "province": "%s", "regency": "%s", "village": "%s", "restoration_type": "%s", "people_involved": "%s", "volume_work": "%s", "unit": "%s", "notes": "%s"}',
            spring_name, spring_province, spring_regency,
            villages[1 + floor(random() * 5)],
            (ARRAY['Pembersihan', 'Penataan', 'Penguatan tebing', 'Pembuatan sumur resapan'])[1 + floor(random() * 4)],
            CAST(floor(random() * 30 + 10) AS TEXT),
            CAST(floor(random() * 5 + 1) AS TEXT),
            (ARRAY['m³', 'meter', 'kg', 'karung'])[1 + floor(random() * 4)],
            'Pembersihan sedimentasi dan sampah di sekitar mata air.')
        WHEN 'trench-development' THEN
          format('{"province": "%s", "regency": "%s", "village": "%s", "trench_length": "%s", "trench_width": "%s", "trench_depth": "%s", "trench_location": "%s", "notes": "%s"}',
            spring_province, spring_regency,
            villages[1 + floor(random() * 5)],
            CAST(floor(random() * 50 + 10) AS TEXT),
            CAST(floor(random() * 3 + 1) AS TEXT),
            CAST(floor(random() * 2 + 1) AS TEXT),
            (ARRAY['Hulu', 'Tengah', 'Hilir', 'Samping jalan'])[1 + floor(random() * 4)],
            'Rorak baru digali untuk menampung air hujan.')
        WHEN 'tree-planting' THEN
          format('{"spring_name": "%s", "province": "%s", "regency": "%s", "village": "%s", "tree_count": "%s", "tree_species": "%s", "planting_area": "%s", "area_unit": "m²", "notes": "%s"}',
            spring_name, spring_province, spring_regency,
            villages[1 + floor(random() * 5)],
            CAST(floor(random() * 100 + 20) AS TEXT),
            (ARRAY['Beringin', 'Kaliandra', 'Sengon', 'Bambu', 'Jati', 'Mahoni', 'Pulai', 'Gmelina'])[1 + floor(random() * 8)],
            CAST(floor(random() * 500 + 50) AS TEXT),
            'Penanaman bibit pohon endemik di area resapan.')
        ELSE
          format('{"province": "%s", "regency": "%s", "village": "%s", "seedling_type": "%s", "seedling_count": "%s", "seedling_quality": "%s", "seedling_source": "%s", "notes": "%s"}',
            spring_province, spring_regency,
            villages[1 + floor(random() * 5)],
            (ARRAY['Kaliandra', 'Sengon', 'Bambu', 'Mahoni', 'Beringin', 'Jati'])[1 + floor(random() * 6)],
            CAST(floor(random() * 500 + 50) AS TEXT),
            (ARRAY['Baik', 'Sedang', 'Premium'])[1 + floor(random() * 3)],
            (ARRAY['Persemaian desa', 'Dinas Kehutanan', 'Kelompok Tani', 'Bibit mandiri'])[1 + floor(random() * 4)],
            'Stok bibit siap salur untuk musim tanam.')
      END,
      spring_lat, spring_lng, spring_pkey,
      now() - (random() * interval '90 days'),
      now() - (random() * interval '90 days')
    )
    RETURNING id INTO report_id;

    IF status_val = 'approved' THEN
      CASE selected_slug
        WHEN 'spring-monitoring' THEN pts := 25;
        WHEN 'spring-restoration' THEN pts := 100;
        WHEN 'trench-development' THEN pts := 50;
        WHEN 'tree-planting' THEN pts := 50;
        WHEN 'seedling-stock' THEN pts := 15;
        ELSE pts := 25;
      END CASE;
      INSERT INTO "PointsLog" (id, "userId", "reportId", amount, reason, metadata, "createdAt")
      VALUES (gen_random_uuid(), chosen_user, report_id, pts, format('Dummy: Approved %s', selected_slug),
              format('{"isDummy": true, "springName": "%s"}', spring_name),
              now() - (random() * interval '90 days'));
    END IF;
  END LOOP;
END $$;

-- 4. Update points ucup ke 25000
UPDATE "Profile" SET points = 25000 WHERE email = 'ucup@springhub.id' AND points < 25000;

-- 5. Verifikasi
SELECT '✅ Seed selesai!' as result;
SELECT COUNT(*) || ' springs (termasuk dummy)' as springs FROM "Spring";
SELECT COUNT(*) || ' reports (dummy)' as reports FROM "Report" WHERE "isDummy" = true;
SELECT 'User: ucup@springhub.id / ucup123 (25000 pts)' as user_info;
