const { Client } = require("pg");
const bcrypt = require("bcryptjs");

async function main() {
  const c = new Client({ connectionString: "postgresql://postgres.bhelvywlvwlqmvyblwmn:jagasemesta001@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres" });
  await c.connect();
  
  // Check stored hash
  const r = await c.query('SELECT email, "passwordHash" FROM "Profile" WHERE email = $1', ["admin@test.com"]);
  const hash = r.rows[0].passwordHash;
  console.log("Stored hash:", hash ? hash.slice(0, 40) + "..." : "null");
  console.log("Hash length:", hash ? hash.length : 0);
  console.log("Hash format:", hash ? (hash.startsWith("$2a$") || hash.startsWith("$2b$") ? "bcrypt OK" : "UNKNOWN") : "null");
  
  // Test compare with direct hash from the same script
  const testHash = await bcrypt.hash("admin123", 12);
  console.log("Fresh hash:", testHash);
  console.log("Fresh hash matches:", await bcrypt.compare("admin123", testHash));
  
  // Try comparing stored hash with the exact value
  console.log("Stored hash raw:", JSON.stringify(hash));
  console.log("Stored hash length:", hash.length);
  console.log("Stored hash vs fresh hash identical?", hash === testHash);
  
  // Insert a fresh hash and test login
  await c.query('UPDATE "Profile" SET "passwordHash" = $1 WHERE email = $2', [testHash, "admin@test.com"]);
  console.log("Updated hash with fresh hash");
  
  // Verify again
  const r2 = await c.query('SELECT "passwordHash" FROM "Profile" WHERE email = $1', ["admin@test.com"]);
  console.log("Admin hash matches:", await bcrypt.compare("admin123", r2.rows[0].passwordHash));

  // Fix volunteer hash too
  const volHash = await bcrypt.hash("vol123456", 12);
  await c.query('UPDATE "Profile" SET "passwordHash" = $1 WHERE email = $2', [volHash, "volunteer@test.com"]);
  const r3 = await c.query('SELECT "passwordHash" FROM "Profile" WHERE email = $1', ["volunteer@test.com"]);
  console.log("Volunteer hash matches:", await bcrypt.compare("vol123456", r3.rows[0].passwordHash));
  
  await c.end();
}
main().catch(e => console.error(e));
