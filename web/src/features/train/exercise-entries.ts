import { exerciseEntrySchema, type ExerciseEntryInput } from "@/contracts/exercise-entry";
import type { Exercise } from "@/contracts/exercise";
import type { PlaylistExercise } from "@/contracts/playlist";

/** One editable exercise row. Numbers stay as text while the user types. */
export type ExerciseEntry = {
  key: string;
  exerciseId: string;
  exerciseName: string;
  muscle: string | null;
  weightKg: string;
  sets: string;
  reps: string;
};

export type EntryField = "weightKg" | "sets" | "reps";
export type EntryErrors = Partial<Record<EntryField, string>>;
export type EntryErrorMap = Record<string, EntryErrors>;

const ENTRY_FIELDS: readonly EntryField[] = ["weightKg", "sets", "reps"];

function isEntryField(value: PropertyKey | undefined): value is EntryField {
  return ENTRY_FIELDS.some((field) => field === value);
}

export function entryFromExercise(exercise: Exercise): ExerciseEntry {
  return {
    key: crypto.randomUUID(),
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    muscle: exercise.primaryMuscle,
    weightKg: "",
    sets: "3",
    reps: "10",
  };
}

export function entryFromPlanItem(item: PlaylistExercise): ExerciseEntry {
  const reps = item.targetRepsMax ?? item.targetRepsMin ?? 10;

  return {
    key: item.id,
    exerciseId: item.exerciseId,
    exerciseName: item.exerciseName,
    muscle: item.primaryMuscle ?? null,
    weightKg: item.targetWeightKg == null ? "" : String(item.targetWeightKg),
    sets: String(item.targetSets ?? 3),
    reps: String(reps),
  };
}

export type ValidatedEntries =
  | { ok: true; values: ExerciseEntryInput[] }
  | { ok: false; errors: EntryErrorMap };

/** An empty weight means bodyweight (0 kg). */
export function validateEntries(entries: readonly ExerciseEntry[]): ValidatedEntries {
  const values: ExerciseEntryInput[] = [];
  const errors: EntryErrorMap = {};

  for (const entry of entries) {
    const parsed = exerciseEntrySchema.safeParse({
      exerciseId: entry.exerciseId,
      weightKg: entry.weightKg.trim() === "" ? "0" : entry.weightKg,
      sets: entry.sets,
      reps: entry.reps,
    });

    if (parsed.success) {
      values.push(parsed.data);
      continue;
    }

    const entryErrors: EntryErrors = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (isEntryField(field) && entryErrors[field] === undefined) {
        entryErrors[field] = issue.message;
      }
    }
    errors[entry.key] = entryErrors;
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, values };
}

/** `4 × 10 · 55 kg`, `3 × 8–12`, `3 × 10`. */
export function formatPrescription(item: PlaylistExercise, formatWeight: (kg: number) => string): string {
  const sets = item.targetSets ?? 3;
  const { targetRepsMin: min, targetRepsMax: max } = item;
  const reps =
    min != null && max != null && min !== max ? `${min}–${max}` : String(max ?? min ?? 10);
  const weight =
    item.targetWeightKg != null && item.targetWeightKg > 0
      ? ` · ${formatWeight(item.targetWeightKg)} kg`
      : "";

  return `${sets} × ${reps}${weight}`;
}
