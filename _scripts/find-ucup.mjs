import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const dbUrl = process.env.DATABASE_URL + '?pgbouncer=true&sslmode=require';
const pool = new pg.Pool({
  connectionString: dbUrl,
  max: 3,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool, { schema: 'public' });
const prisma = new PrismaClient({ adapter });

try {
  const all = await prisma.profile.findMany({ take: 20, orderBy: { createdAt: 'desc' } });
  console.log('Total users:', all.length);
  for (const u of all) {
    console.log(`${u.id} | ${u.username} | role=${u.role} | email=${u.email}`);
  }
} catch (e) {
  console.error('Error type:', e.constructor?.name);
  console.error('Error msg:', e.message);
  if (e.code) console.error('Error code:', e.code);
  if (e.meta) console.error('Error meta:', JSON.stringify(e.meta));
}
await prisma.$disconnect();
