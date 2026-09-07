// routes/reports.route.ts — 5 baris (staging)
import { guard } from "@/middlewares/guard";
import { reportController } from "@/controllers/reportController";

export async function POST(req: Request) {
  const { session } = await guard(req, { rate: "api" });
  return reportController.create(req, session);
}
