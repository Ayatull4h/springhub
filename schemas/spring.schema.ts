import { z } from "zod";

export const springSearchSchema = z.object({
  q: z.string().min(2, "Minimal 2 huruf").max(100).optional(),
  status: z.enum(["pending", "active", "merged"]).optional(),
});

export const springBulkSchema = z.object({
  ids: z.string().min(1).transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 50)),
});
