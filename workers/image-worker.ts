import { Worker } from "bullmq";
import sharp from "sharp";
import logger from "../lib/logger";
import { redisConnectionFromUrl } from "../lib/redis-connection";

const connection = redisConnectionFromUrl(process.env.REDIS_QUEUE_URL);

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
