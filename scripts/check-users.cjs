const { Client } = require('pg');
const c = new Client({
  connectionString: 'postgresql://postgres.bhelvywlvwlqmvyblwmn:jagasemesta001@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});
(async () => {
  await c.connect();
  // Check if test users exist with correct passwords
  const users = await c.query('SELECT email, role FROM "Profile" ORDER BY email');
  console.log('Users in DB:');
  users.rows.forEach(u => console.log(`  ${u.email} (${u.role})`));
  await c.end();
})();
