import { z } from "zod";
import { isoDateTime } from "./primitives";

export const actionTypeSchema = z.enum(["INSERT", "UPDATE", "DELETE"]);

export const importJobStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "DONE",
  "FAILED",
]);

export const importStatusSchema = z.enum(["CREATED", "DUPLICATE", "ERROR"]);

export const bioimpedanceSchema = z.object({
  id: z.uuid(),
  measuredAt: isoDateTime,
  bodyWeightKg: z.number().nullish(),
  heightCm: z.number().nullish(),
  bodyFatPercentage: z.number().nullish(),
  muscleMassKg: z.number().nullish(),
  skeletalMuscleMassKg: z.number().nullish(),
  visceralFat: z.number().nullish(),
  waterPercentage: z.number().nullish(),
  source: z.string().nullish(),
  sourceFileHash: z.string().nullish(),
});

/** Auditoria de uma medição: o payload antigo/novo é JSON livre vindo do backend. */
export const bioimpedanceLogSchema = z.object({
  id: z.uuid(),
  actionType: actionTypeSchema,
  oldData: z.unknown().nullish(),
  newData: z.unknown().nullish(),
  createdAt: isoDateTime,
});

export const importJobSchema = z.object({
  id: z.uuid(),
  status: importJobStatusSchema,
  sourceFileName: z.string(),
  sourceFileHash: z.string(),
  result: z.unknown().nullish(),
  error: z.string().nullish(),
  createdAt: isoDateTime,
  finishedAt: isoDateTime.nullish(),
});

export const importResponseSchema = z.object({
  results: z.array(
    z.object({
      index: z.number().int(),
      status: importStatusSchema,
      id: z.uuid().nullish(),
      message: z.string().nullish(),
    }),
  ),
  created: z.number().int(),
  duplicates: z.number().int(),
  errors: z.number().int(),
});

export type ActionType = z.infer<typeof actionTypeSchema>;
export type ImportJobStatus = z.infer<typeof importJobStatusSchema>;
export type ImportStatus = z.infer<typeof importStatusSchema>;
export type Bioimpedance = z.infer<typeof bioimpedanceSchema>;
export type BioimpedanceLog = z.infer<typeof bioimpedanceLogSchema>;
export type ImportJob = z.infer<typeof importJobSchema>;
export type ImportResponse = z.infer<typeof importResponseSchema>;
