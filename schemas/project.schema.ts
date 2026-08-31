import { z } from "zod";

export const projectListSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  page: z.coerce.number().int().min(1).default(1),
});

export const projectCreateSchema = z.object({
  B1_judul: z.string().min(1).max(200),
  B3_tempat: z.string().min(1).max(200),
  B2_jenis: z.union([z.string(), z.array(z.string())]).optional(),
});
