import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

// Use the exact same config as lib/prisma.ts
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  maxUses: 3000,
});
const adapter = new PrismaPg(pool, { schema: 'public' });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Check if ucup exists
  const existing = await prisma.profile.findFirst({ where: { username: 'ucup' } });
  if (existing) {
    console.log('UCUP FOUND:');
    console.log(`  ID: ${existing.id}`);
    console.log(`  Username: ${existing.username}`);
    console.log(`  Role: ${existing.role}`);
    console.log(`  Email: ${existing.email}`);
    console.log(`  Trust Score: ${existing.trustScore}`);
    console.log(`  Points: ${existing.points}`);
    return;
  }

  // Check if ucup email exists
  const byEmail = await prisma.profile.findFirst({ where: { email: 'ucup@example.com' } });
  if (byEmail) {
    console.log('UCUP FOUND (by email):');
    console.log(`  ID: ${byEmail.id}`);
    console.log(`  Username: ${byEmail.username}`);
    console.log(`  Role: ${byEmail.role}`);
    console.log(`  Email: ${byEmail.email}`);
    return;
  }

  // Create ucup user
  const passwordHash = await bcrypt.hash('ucup123', 12);
  const user = await prisma.profile.create({
    data: {
      username: 'ucup',
      email: 'ucup@example.com',
      passwordHash,
      role: 'volunteer',
      trustScore: 50,
      points: 0,
    },
  });
  console.log('UCUP CREATED:');
  console.log(`  ID: ${user.id}`);
  console.log(`  Username: ${user.username}`);
  console.log(`  Password: ucup123`);
  console.log(`  Role: ${user.role}`);
}

main()
  .catch(e => { console.error('ERROR:', e.message); })
  .finally(() => prisma.$disconnect());
