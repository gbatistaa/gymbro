"use client";

import { useMemo, useState } from "react";
import type { Exercise } from "@/contracts/exercise";
import {
  entryFromExercise,
  type EntryErrorMap,
  type EntryField,
  type ExerciseEntry,
} from "./exercise-entries";

export type ExerciseEntriesState = {
  entries: ExerciseEntry[];
  errors: EntryErrorMap;
  excludedIds: ReadonlySet<string>;
  add: (exercise: Exercise) => void;
  update: (key: string, field: EntryField, value: string) => void;
  remove: (key: string) => void;
  setErrors: (errors: EntryErrorMap) => void;
};

/** Local state for an editable list of exercises; each field error clears as the user fixes it. */
export function useExerciseEntries(initial: ExerciseEntry[] = []): ExerciseEntriesState {
  const [entries, setEntries] = useState<ExerciseEntry[]>(initial);
  const [errors, setErrors] = useState<EntryErrorMap>({});

  const excludedIds = useMemo(
    () => new Set(entries.map((entry) => entry.exerciseId)),
    [entries],
  );

  function add(exercise: Exercise) {
    setEntries((current) =>
      current.some((entry) => entry.exerciseId === exercise.id)
        ? current
        : [...current, entryFromExercise(exercise)],
    );
  }

  function update(key: string, field: EntryField, value: string) {
    setEntries((current) =>
      current.map((entry) => (entry.key === key ? { ...entry, [field]: value } : entry)),
    );
    setErrors((current) => {
      const entryErrors = current[key];
      if (!entryErrors?.[field]) return current;
      return { ...current, [key]: { ...entryErrors, [field]: undefined } };
    });
  }

  function remove(key: string) {
    setEntries((current) => current.filter((entry) => entry.key !== key));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  return { entries, errors, excludedIds, add, update, remove, setErrors };
}
