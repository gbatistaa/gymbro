"use client";

import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import type { EntryErrorMap, EntryField, ExerciseEntry } from "./exercise-entries";
import styles from "./plans.module.css";

type ExerciseEntryListProps = {
  entries: readonly ExerciseEntry[];
  errors: EntryErrorMap;
  emptyText: string;
  onChange: (key: string, field: EntryField, value: string) => void;
  onRemove: (key: string) => void;
};

/** Editable weight, sets and reps for each exercise, with the target muscle as a badge. */
export function ExerciseEntryList({
  entries,
  errors,
  emptyText,
  onChange,
  onRemove,
}: ExerciseEntryListProps) {
  if (entries.length === 0) {
    return <p className={styles.emptyHint}>{emptyText}</p>;
  }

  return (
    <ul className={styles.entryList}>
      {entries.map((entry) => {
        const entryErrors = errors[entry.key] ?? {};

        return (
          <li key={entry.key} className={styles.entryCard}>
            <div className={styles.entryTop}>
              <div className={styles.entryTitle}>
                <span className={styles.entryName}>{entry.exerciseName}</span>
                {entry.muscle ? <Badge tone="primary">{entry.muscle}</Badge> : null}
              </div>
              <button
                type="button"
                className={styles.entryRemove}
                aria-label={`Remove ${entry.exerciseName}`}
                onClick={() => onRemove(entry.key)}
              >
                <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>

            <div className={styles.entryFields}>
              <Field
                id={`weight-${entry.key}`}
                label="Weight (kg)"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.5"
                placeholder="0"
                value={entry.weightKg}
                error={entryErrors.weightKg}
                onChange={(event) => onChange(entry.key, "weightKg", event.target.value)}
              />
              <Field
                id={`sets-${entry.key}`}
                label="Sets"
                type="number"
                inputMode="numeric"
                min={1}
                max={20}
                value={entry.sets}
                error={entryErrors.sets}
                onChange={(event) => onChange(entry.key, "sets", event.target.value)}
              />
              <Field
                id={`reps-${entry.key}`}
                label="Reps"
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                value={entry.reps}
                error={entryErrors.reps}
                onChange={(event) => onChange(entry.key, "reps", event.target.value)}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
