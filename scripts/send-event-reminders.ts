/**
 * SpringHub — Reminder H-1 Event (dijalankan per jam via cron)
 * Mencari event yang mulai besok (jendela 24–48 jam ke depan) dan
 * mengantrekan email pengingat ke pendaftar yang belum diingatkan.
 * Idempotent: hanya yang remindedAt IS NULL, lalu ditandai.
 *
 * Cron: /etc/cron.d/springhub-event-reminder
 *   0 * * * * root DOTENV_CONFIG_PATH=/root/springhub/.env.production /usr/bin/npx --prefix /root/springhub tsx scripts/send-event-reminders.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { emailQueue } from "../lib/queue";
import { escapeHtml } from "../lib/sanitize";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  connectionTimeoutMillis: 10000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function fmtTanggal(d: Date): string {
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL tidak ditemukan");
    process.exit(1);
  }
  const now = new Date();
  const from = new Date(now.getTime() + 24 * 3600 * 1000);
  const to = new Date(now.getTime() + 48 * 3600 * 1000);

  const events = await prisma.event.findMany({
    where: { isActive: true, startDate: { gte: from, lt: to } },
    select: { id: true, title: true, location: true, startDate: true },
  });
  console.log(`Event H-1 ditemukan: ${events.length}`);

  let queued = 0;
  for (const ev of events) {
    const regs = await prisma.eventRegistration.findMany({
      where: { eventId: ev.id, remindedAt: null },
      select: { id: true, nama: true, email: true, hari: true },
    });
    for (const r of regs) {
      const subject = `Pengingat: ${ev.title} besok!`;
      const html = `<p>Halo ${escapeHtml(r.nama)},</p><p>Ini pengingat bahwa <strong>${escapeHtml(ev.title)}</strong> akan berlangsung <strong>besok, ${fmtTanggal(ev.startDate)}</strong>${ev.location ? ` di ${escapeHtml(ev.location)}` : ""}.</p><p>Kamu terdaftar untuk ${r.hari} hari. Sampai jumpa di lokasi!</p><p>Salam,<br/>Tim SpringHub</p>`;
      await emailQueue.add("event-reminder", {
        to: r.email,
        subject,
        html,
        text: `Halo ${r.nama}, pengingat: ${ev.title} besok (${fmtTanggal(ev.startDate)})${ev.location ? ` di ${ev.location}` : ""}.`,
      });
      await prisma.eventRegistration.update({ where: { id: r.id }, data: { remindedAt: new Date() } });
      queued++;
    }
    console.log(`  ${ev.title}: ${regs.length} email diantrekan`);
  }

  console.log(`Selesai. Total antrean: ${queued}`);
  await prisma.$disconnect();
  await pool.end();
  process.exit(0);
}

main().catch((e) => {
  console.error("Gagal:", e);
  process.exit(1);
});
