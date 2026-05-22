import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const result = await p.contentBlock.updateMany({
    where: { section: 'media', type: 'press' },
    data: { imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Kompas_logo.svg/1200px-Kompas_logo.svg.png' },
  });
  console.log('✅ Press image updated to Kompas logo');
  console.log('Updated count:', result.count);
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await p.$disconnect();
}
