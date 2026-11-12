import { z } from "zod";
import { isoDateTime } from "./primitives";

export const exerciseSchema = z.object({
  id: z.uuid(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime.nullish(),
  name: z.string(),
  primaryMuscle: z.string(),
  secondaryMuscle: z.string().nullish(),
  equipment: z.string().nullish(),
  incrementKg: z.number().nullish(),
  isArchived: z.boolean(),
});

export type Exercise = z.infer<typeof exerciseSchema>;
