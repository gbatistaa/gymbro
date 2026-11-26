import { z } from "zod";
import { isoDateTime } from "./primitives";

export const playlistSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullish(),
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
  targetWeightKg: z.number().nullish(),
  primaryMuscle: z.string().nullish(),
});

/** Workout plan list row: basics, exercise count, last time it was done and an exercise preview. */
export const playlistSummarySchema = playlistSchema.extend({
  exerciseCount: z.number().int(),
  lastPerformedAt: isoDateTime.nullish(),
  exercises: z.array(playlistExerciseSchema),
});

export const playlistDetailSchema = playlistSchema.extend({
  exercises: z.array(playlistExerciseSchema),
});

export type Playlist = z.infer<typeof playlistSchema>;
export type PlaylistSummary = z.infer<typeof playlistSummarySchema>;
export type PlaylistExercise = z.infer<typeof playlistExerciseSchema>;
export type PlaylistDetail = z.infer<typeof playlistDetailSchema>;
