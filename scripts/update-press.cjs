require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool, { schema: 'public' });
const p = new PrismaClient({ adapter });

async function main() {
  const result = await p.contentBlock.updateMany({
    where: { section: 'media', type: 'press' },
    data: { imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Kompas_logo.svg/1200px-Kompas_logo.svg.png' },
  });
  console.log('Updated count:', result.count);
}

main().catch(e => console.error('Error:', e.message)).finally(() => p.$disconnect());
