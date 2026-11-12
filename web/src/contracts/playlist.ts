import { z } from "zod";
import { isoDateTime } from "./primitives";

export const playlistSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullish(),
  archivedAt: isoDateTime.nullish(),
});

/** Linha da lista de rotinas: o básico mais contagem de exercícios e última execução. */
export const playlistSummarySchema = playlistSchema.extend({
  exerciseCount: z.number().int(),
  lastPerformedAt: isoDateTime.nullish(),
});

export const playlistExerciseSchema = z.object({
  id: z.uuid(),
  exerciseId: z.uuid(),
  exerciseName: z.string(),
  orderIndex: z.number().int().nullish(),
  targetSets: z.number().int().nullish(),
  targetRepsMin: z.number().int().nullish(),
  targetRepsMax: z.number().int().nullish(),
  restSeconds: z.number().int().nullish(),
  note: z.string().nullish(),
});

export const playlistDetailSchema = playlistSchema.extend({
  exercises: z.array(playlistExerciseSchema),
});

export type Playlist = z.infer<typeof playlistSchema>;
export type PlaylistSummary = z.infer<typeof playlistSummarySchema>;
export type PlaylistExercise = z.infer<typeof playlistExerciseSchema>;
export type PlaylistDetail = z.infer<typeof playlistDetailSchema>;
