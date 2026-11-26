import { z } from "zod";
import { isoDateTime } from "./primitives";

/** A logged workout for a plan. No start, end or duration: only when it was done and what was lifted. */
export const completionSchema = z.object({
  id: z.uuid(),
  playlistId: z.uuid(),
  playlistName: z.string(),
  completedAt: isoDateTime,
  loggedSets: z.number().int(),
  totalVolume: z.number(),
});

export const completionSummarySchema = z.object({
  totalCount: z.number().int(),
  thisWeekCount: z.number().int(),
});

export type Completion = z.infer<typeof completionSchema>;
export type CompletionSummary = z.infer<typeof completionSummarySchema>;
