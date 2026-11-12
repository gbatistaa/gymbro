import { z } from "zod";
import { isoDateTime } from "./primitives";

export const dashboardSchema = z.object({
  weeks: z.array(
    z.object({
      weekStart: isoDateTime,
      sessions: z.number().int(),
      volume: z.number(),
    }),
  ),
  currentStreakWeeks: z.number().int(),
  recentPrs: z.array(
    z.object({
      logId: z.uuid(),
      exerciseId: z.uuid(),
      exerciseName: z.string(),
      performedAt: isoDateTime,
      weight: z.number().nullish(),
      reps: z.number().int().nullish(),
      e1rm: z.number(),
    }),
  ),
  weightDeltaKg: z.number().nullish(),
  nextPlaylistId: z.uuid().nullish(),
  nextPlaylistName: z.string().nullish(),
  timezone: z.string(),
});

export const exerciseStatsSchema = z.object({
  exerciseId: z.uuid(),
  sessionCount: z.number().int(),
  totalVolume: z.number(),
  bestWeight: z.number().nullish(),
  bestE1rm: z.number().nullish(),
  lastPerformedAt: isoDateTime.nullish(),
  monthlyBuckets: z.array(
    z.object({
      periodStart: isoDateTime,
      volume: z.number(),
      bestE1rm: z.number().nullish(),
    }),
  ),
});

/** Sugestão de progressão para o próximo treino de uma rotina. */
export const nextTargetSchema = z.object({
  exerciseId: z.uuid(),
  exerciseName: z.string(),
  targetSets: z.number().int().nullish(),
  targetRepsMin: z.number().int().nullish(),
  targetRepsMax: z.number().int().nullish(),
  lastWeight: z.number().nullish(),
  lastReps: z.number().int().nullish(),
  suggestedWeight: z.number().nullish(),
  suggestedReps: z.number().int().nullish(),
});

export const trendSchema = z.object({
  metric: z.string(),
  points: z.array(
    z.object({
      measuredAt: isoDateTime,
      value: z.number().nullish(),
      movingAverage: z.number().nullish(),
    }),
  ),
  deltaAbsolute: z.number().nullish(),
  deltaPercentage: z.number().nullish(),
});

export const muscleVolumeSchema = z.object({
  muscle: z.string(),
  volume: z.number(),
  sets: z.number().int(),
});

export type Dashboard = z.infer<typeof dashboardSchema>;
export type ExerciseStats = z.infer<typeof exerciseStatsSchema>;
export type NextTarget = z.infer<typeof nextTargetSchema>;
export type Trend = z.infer<typeof trendSchema>;
export type MuscleVolume = z.infer<typeof muscleVolumeSchema>;
