-- Fix ucup account: reset password + tambah points untuk submit project
-- Jalankan di Supabase Dashboard > SQL Editor

-- Password: ucup12345 (hash bcrypt cost 12, valid)
-- Hash generated via: node -e "require('bcryptjs').hash('ucup12345',12).then(console.log)"
INSERT INTO "Profile" (id, email, "passwordHash", username, role, points, "trustScore", region, "createdAt")
VALUES (
  gen_random_uuid(),
  'ucup@springhub.id',
  '$2b$12$eT7oozvJe4CRGFeXKlXoveRFvdGzEKHQWdLt5iSKlpEO3e3GPWGgC',
  'Ucup',
  'volunteer',
  20168,
  50,
  'Jawa Timur',
  NOW()
)
ON CONFLICT ("email") DO UPDATE SET
  "passwordHash" = EXCLUDED."passwordHash",
  points = 20168,
  username = 'Ucup',
  role = 'volunteer',
  region = 'Jawa Timur';
