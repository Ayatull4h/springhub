import { z } from "zod";

export const seedlingQuerySchema = z.object({
  mine: z.enum(["1", "0"]).optional(),
  species: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
});

export const seedlingCreateSchema = z.object({
  species: z.string().min(1).max(100),
  quantity: z.number().int().min(1).max(9999),
  province: z.string().min(1).max(100),
  regency: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});
