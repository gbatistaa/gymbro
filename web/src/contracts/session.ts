import { z } from "zod";
import { isoDateTime } from "./primitives";

export const sessionStatusSchema = z.enum([
  "IN_PROGRESS",
  "FINISHED",
  "ABANDONED",
]);

export const sessionSchema = z.object({
  id: z.uuid(),
  playlistId: z.uuid().nullish(),
  status: sessionStatusSchema,
  startedAt: isoDateTime,
  endedAt: isoDateTime.nullish(),
  totalVolume: z.number().nullish(),
  notes: z.string().nullish(),
  version: z.number().int(),
});

export const logSchema = z.object({
  id: z.uuid(),
  clientLogId: z.uuid(),
  exerciseId: z.uuid(),
  exerciseName: z.string(),
  setNumber: z.number().int().nullish(),
  weight: z.number(),
  reps: z.number().int(),
  isPr: z.boolean().nullish(),
  rpe: z.number().int().nullish(),
  notes: z.string().nullish(),
});

export const exerciseLogsSchema = z.object({
  exerciseId: z.uuid(),
  exerciseName: z.string(),
  sets: z.array(logSchema),
});

export const sessionDetailSchema = z.object({
  id: z.uuid(),
  playlistId: z.uuid().nullish(),
  status: sessionStatusSchema,
  startedAt: isoDateTime,
  endedAt: isoDateTime.nullish(),
  totalVolume: z.number().nullish(),
  notes: z.string().nullish(),
  exercises: z.array(exerciseLogsSchema),
});

export type SessionStatus = z.infer<typeof sessionStatusSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type Log = z.infer<typeof logSchema>;
export type ExerciseLogs = z.infer<typeof exerciseLogsSchema>;
export type SessionDetail = z.infer<typeof sessionDetailSchema>;
