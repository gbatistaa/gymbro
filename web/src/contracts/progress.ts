import { z } from "zod";
import { pageSchema } from "./page";
import { isoDateTime } from "./primitives";

/** Colunas aceitas pelo `sort` de `GET /api/progress/exercises`. */
export const EXERCISE_PROGRESS_SORTS = [
  "LAST_PERFORMED_AT",
  "NAME",
  "SESSION_COUNT",
  "TOTAL_SETS",
  "TOTAL_VOLUME",
  "BEST_WEIGHT",
  "BEST_E1RM",
] as const;

export const SORT_DIRECTIONS = ["ASC", "DESC"] as const;

export const SERIES_BUCKETS = ["DAY", "WEEK", "MONTH"] as const;

/** Quantos exercícios cabem no topo do painel (o backend valida o mesmo limite). */
export const MAX_PINNED_EXERCISES = 4;

export type ExerciseProgressSort = (typeof EXERCISE_PROGRESS_SORTS)[number];
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export const exerciseProgressSummarySchema = z.object({
  exerciseId: z.uuid(),
  name: z.string(),
  primaryMuscle: z.string(),
  sessionCount: z.number().int().nonnegative(),
  totalSets: z.number().int().nonnegative(),
  totalVolume: z.number(),
  bestWeight: z.number(),
  bestE1rm: z.number(),
  lastPerformedAt: isoDateTime,
  isPinned: z.boolean(),
});

export const exerciseProgressPageSchema = pageSchema(exerciseProgressSummarySchema);

export const seriesPointSchema = z.object({
  periodStart: isoDateTime,
  sessions: z.number().int().nonnegative(),
  sets: z.number().int().nonnegative(),
  reps: z.number().int().nonnegative(),
  maxWeight: z.number(),
  volume: z.number(),
  bestE1rm: z.number(),
});

export const exerciseSeriesSchema = z.object({
  exerciseId: z.uuid(),
  name: z.string(),
  primaryMuscle: z.string(),
  bucket: z.enum(SERIES_BUCKETS),
  from: isoDateTime,
  to: isoDateTime,
  points: z.array(seriesPointSchema),
  summary: z.object({
    sessionCount: z.number().int().nonnegative(),
    totalSets: z.number().int().nonnegative(),
    totalReps: z.number().int().nonnegative(),
    totalVolume: z.number(),
    bestWeight: z.number().nullish(),
    bestE1rm: z.number().nullish(),
    lastPerformedAt: isoDateTime.nullish(),
  }),
});

export const pinnedExerciseSchema = z.object({
  exerciseId: z.uuid(),
  name: z.string(),
  primaryMuscle: z.string(),
  position: z.number().int().min(0).max(MAX_PINNED_EXERCISES - 1),
});

export const pinnedExercisesSchema = z.array(pinnedExerciseSchema).max(MAX_PINNED_EXERCISES);

export const BIOIMPEDANCE_EVOLUTION_METRICS = [
  "bodyWeightKg",
  "bodyFatPercentage",
  "muscleMassKg",
  "skeletalMuscleMassKg",
  "visceralFat",
  "waterPercentage",
] as const;

export const bioimpedanceEvolutionSchema = z.object({
  from: isoDateTime,
  to: isoDateTime,
  measurementCount: z.number().int().nonnegative(),
  metrics: z.array(
    z.object({
      metric: z.enum(BIOIMPEDANCE_EVOLUTION_METRICS),
      points: z.array(z.object({ measuredAt: isoDateTime, value: z.number() })),
      first: z.number().nullish(),
      last: z.number().nullish(),
      min: z.number().nullish(),
      max: z.number().nullish(),
      deltaAbsolute: z.number().nullish(),
      deltaPercentage: z.number().nullish(),
    }),
  ),
});

export type ExerciseProgressSummary = z.infer<typeof exerciseProgressSummarySchema>;
export type ExerciseProgressPage = z.infer<typeof exerciseProgressPageSchema>;
export type SeriesPoint = z.infer<typeof seriesPointSchema>;
export type ExerciseSeries = z.infer<typeof exerciseSeriesSchema>;
export type PinnedExercise = z.infer<typeof pinnedExerciseSchema>;
export type BioimpedanceEvolution = z.infer<typeof bioimpedanceEvolutionSchema>;
export type MetricEvolution = BioimpedanceEvolution["metrics"][number];
export type BioimpedanceEvolutionMetric = MetricEvolution["metric"];
