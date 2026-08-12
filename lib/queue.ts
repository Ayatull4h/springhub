import { Queue, Worker } from "bullmq";
import { getRedisConnectionOptions } from "@/lib/redis-connection";

const connection = getRedisConnectionOptions();

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
