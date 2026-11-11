import { z } from "zod";

export const fieldErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export const apiErrorSchema = z.object({
  timestamp: z.iso.datetime({ offset: true }),
  status: z.number().int(),
  code: z.string(),
  message: z.string(),
  path: z.string(),
  errors: z.array(fieldErrorSchema),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
