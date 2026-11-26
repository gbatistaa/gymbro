import { z } from "zod";

/**
 * One exercise row typed by the user (weight, sets and reps), shared by the "new plan" and
 * "log workout" forms. Inputs arrive as text, so the schema coerces and bounds them.
 */
export const exerciseEntrySchema = z.object({
  exerciseId: z.uuid(),
  weightKg: z.coerce
    .number({ message: "Informe a carga em kg." })
    .min(0, "A carga não pode ser negativa.")
    .max(1000, "Use no máximo 1000 kg."),
  sets: z.coerce
    .number({ message: "Informe o número de séries." })
    .int("O número de séries deve ser inteiro.")
    .min(1, "Use ao menos 1 série.")
    .max(20, "Use no máximo 20 séries."),
  reps: z.coerce
    .number({ message: "Informe as repetições." })
    .int("O número de repetições deve ser inteiro.")
    .min(1, "Use ao menos 1 repetição.")
    .max(100, "Use no máximo 100 repetições."),
});

export const planFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome da rotina.")
    .max(120, "Use no máximo 120 caracteres."),
  description: z.string().trim().max(500, "Use no máximo 500 caracteres."),
  exercises: z.array(exerciseEntrySchema).max(50, "Use no máximo 50 exercícios."),
});

export const workoutLogFormSchema = z.object({
  exercises: z.array(exerciseEntrySchema).max(50, "Use no máximo 50 exercícios."),
});

export type ExerciseEntryInput = z.infer<typeof exerciseEntrySchema>;
export type PlanFormInput = z.infer<typeof planFormSchema>;
export type WorkoutLogFormInput = z.infer<typeof workoutLogFormSchema>;
