const { Client } = require("pg");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const url = "postgresql://postgres.bhelvywlvwlqmvyblwmn:jagasemesta001@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

async function main() {
  const client = new Client({ connectionString: url, connectionTimeoutMillis: 10000 });
  await client.connect();
  console.log("Connected to DB ✅\n");

  // Create admin user
  const adminPw = await bcrypt.hash("admin123", 12);
  const adminId = crypto.randomUUID();
  await client.query(`
    INSERT INTO "Profile" (id, email, "passwordHash", username, role, points, "trustScore", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (email) DO UPDATE SET role = 'admin', points = 999999
  `, [adminId, "admin@test.com", adminPw, "Admin SpringHub", "admin", 999999, 100, new Date(), new Date()]);
  console.log("✅ Admin user (admin@test.com / admin123)");

  // Create volunteer user
  const volPw = await bcrypt.hash("vol123456", 12);
  const volId = crypto.randomUUID();
  await client.query(`
    INSERT INTO "Profile" (id, email, "passwordHash", username, role, points, "trustScore", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (email) DO UPDATE SET points = 25000
  `, [volId, "volunteer@test.com", volPw, "Test Volunteer", "volunteer", 25000, 75, new Date(), new Date()]);
  console.log("✅ Volunteer user (volunteer@test.com / vol123456)");

  // Run featuredPhotoId migration
  await client.query('ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "featuredPhotoId" TEXT');
  await client.query('CREATE INDEX IF NOT EXISTS idx_report_featuredPhotoId ON "Report"("featuredPhotoId")');
  console.log("✅ featuredPhotoId migration applied");

  // Summary
  const users = await client.query('SELECT email, role, points FROM "Profile" ORDER BY "createdAt"');
  console.log("\nUsers in DB:");
  users.rows.forEach(u => console.log(`  ${u.email} (${u.role}) - ${u.points} pts`));

  const forms = await client.query('SELECT COUNT(*) as c FROM "Form"');
  console.log(`\nForms: ${forms.rows[0].c}`);

  const courses = await client.query('SELECT COUNT(*) as c FROM "Course"');
  console.log(`Courses: ${courses.rows[0].c}`);

  const reports = await client.query('SELECT COUNT(*) as c FROM "Report"');
  console.log(`Reports: ${reports.rows[0].c}`);

  await client.end();
  console.log("\nSeed complete ✅");
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
