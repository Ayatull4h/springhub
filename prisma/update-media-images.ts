import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool, { schema: "public" });

const p = new PrismaClient({ adapter });

async function main() {
  const [events, press] = await Promise.all([
    p.contentBlock.updateMany({
      where: { section: 'media', type: 'event' },
      data: { imageUrl: '/images/event.png' },
    }),
    p.contentBlock.updateMany({
      where: { section: 'media', type: 'press' },
      data: { imageUrl: '/images/pers.png' },
    }),
  ]);

  console.log(`Event rows updated: ${events.count}`);
  console.log(`Press rows updated: ${press.count}`);

  const updated = await p.contentBlock.findMany({
    where: { section: 'media' },
  });
  console.log('Updated media blocks:');
  console.log(JSON.stringify(updated, null, 2));
}

main()
  .catch((e) => {
    console.error('ERROR:', e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
