import { z } from "zod";
import { isoDateTime } from "./primitives";

/** Um "fiz o treino" registrado para uma ficha. Não há início, fim nem duração. */
export const completionSchema = z.object({
  id: z.uuid(),
  playlistId: z.uuid(),
  playlistName: z.string(),
  completedAt: isoDateTime,
});

export const completionSummarySchema = z.object({
  totalCount: z.number().int(),
  thisWeekCount: z.number().int(),
});

export type Completion = z.infer<typeof completionSchema>;
export type CompletionSummary = z.infer<typeof completionSummarySchema>;
