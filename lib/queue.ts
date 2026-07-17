import { Queue, Worker } from "bullmq";

const connection = {
  host: process.env.REDIS_QUEUE_URL
    ? new URL(process.env.REDIS_QUEUE_URL).hostname
    : "localhost",
  port: process.env.REDIS_QUEUE_URL
    ? parseInt(new URL(process.env.REDIS_QUEUE_URL).port || "6379", 10)
    : 6379,
};

export const emailQueue = new Queue("email", { connection });
export const imageQueue = new Queue("image-processing", { connection });
export const exportQueue = new Queue("export", { connection });

export type EmailJobData = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type ImageJobData = {
  reportPhotoId: string;
  storagePath: string;
  bucket: string;
};

export type ExportJobData = {
  type: "users" | "reports" | "donations" | "projects" | "feedback";
  startDate: string;
  endDate: string;
  adminEmail: string;
  format: "csv";
};
