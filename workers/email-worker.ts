import { Worker } from "bullmq";
import { sendEmail } from "../lib/email";
import logger from "../lib/logger";
import { redisConnectionFromUrl } from "../lib/redis-connection";

const connection = redisConnectionFromUrl(process.env.REDIS_QUEUE_URL);

const worker = new Worker(
  "email",
  async (job) => {
    const { to, subject, html, text } = job.data;
    await sendEmail({ to, subject, html, text });
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 50,
      duration: 60_000, // max 50 emails per minute
    },
  }
);

worker.on("completed", (job) => {
  logger.info({ to: job.data.to }, "Email sent");
});

worker.on("failed", (job, err) => {
  logger.error({ to: job?.data?.to, error: err.message }, "Email failed");
});

logger.info("Email worker started");
