import { Worker } from "bullmq";
import sharp from "sharp";
import logger from "../lib/logger";

const connection = {
  host: process.env.REDIS_QUEUE_URL
    ? new URL(process.env.REDIS_QUEUE_URL).hostname
    : "localhost",
  port: process.env.REDIS_QUEUE_URL
    ? parseInt(new URL(process.env.REDIS_QUEUE_URL).port || "6379", 10)
    : 6379,
};

const worker = new Worker(
  "image-processing",
  async (job) => {
    const { storagePath } = job.data;

    // For now, the actual S3 download/compress/upload loop
    // will be implemented when R2 integration is complete.
    // This worker receives the storage path, downloads from R2,
    // compresses with sharp, and re-uploads the compressed version.
    logger.info({ storagePath }, "Processing image");
  },
  { connection }
);

worker.on("completed", (job) => {
  logger.info({ storagePath: job.data.storagePath }, "Image processed");
});

worker.on("failed", (job, err) => {
  logger.error({ storagePath: job?.data?.storagePath, error: err.message }, "Image processing failed");
});

logger.info("Image worker started");
