"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import {
  playlistExerciseSchema,
  type PlaylistExercise,
} from "@/contracts/playlist";
import { describeApiError } from "@/lib/api-error-text";
import { request } from "@/lib/http";
import styles from "./train.module.css";

type PlaylistItemFormProps = {
  playlistId: string;
  item: PlaylistExercise;
  onSaved: () => void;
  onCancel: () => void;
};

type FormValues = {
  targetWeightKg: string;
  targetSets: string;
  targetRepsMin: string;
  targetRepsMax: string;
  restSeconds: string;
  note: string;
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

function toInteger(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function toWeight(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  const weight = toWeight(values.targetWeightKg);
  const sets = toInteger(values.targetSets);
  const repsMin = toInteger(values.targetRepsMin);
  const repsMax = toInteger(values.targetRepsMax);
  const rest = toInteger(values.restSeconds);

  if (weight !== null && (Number.isNaN(weight) || weight < 0 || weight > 1000)) {
    errors.targetWeightKg = "Use 0 to 1000 kg.";
  }
  if (sets === null || sets < 1 || sets > 20) {
    errors.targetSets = "Use 1 to 20 sets.";
  }
  if (repsMin === null || repsMin < 1) {
    errors.targetRepsMin = "Use at least 1 rep.";
  }
  if (repsMax === null || repsMax < 1) {
    errors.targetRepsMax = "Use at least 1 rep.";
  }
  if (
    repsMin !== null &&
    repsMax !== null &&
    repsMin >= 1 &&
    repsMax >= 1 &&
    repsMin > repsMax
  ) {
    errors.targetRepsMax = "Max reps must be greater than or equal to min reps.";
  }
  if (rest === null || rest < 0 || rest > 600) {
    errors.restSeconds = "Use 0 to 600 seconds.";
  }
  if (values.note.trim().length > 500) {
    errors.note = "Use at most 500 characters.";
  }

  return errors;
}

export function PlaylistItemForm({
  playlistId,
  item,
  onSaved,
  onCancel,
}: PlaylistItemFormProps) {
  const [values, setValues] = useState<FormValues>({
    targetWeightKg: item.targetWeightKg == null ? "" : String(item.targetWeightKg),
    targetSets: String(item.targetSets ?? 3),
    targetRepsMin: String(item.targetRepsMin ?? 8),
    targetRepsMax: String(item.targetRepsMax ?? 12),
    restSeconds: String(item.restSeconds ?? 90),
    note: item.note ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function setField(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) =>
      current[field] ? { ...current, [field]: undefined } : current,
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setFormError(null);
    setIsSaving(true);

    try {
      await request(
        {
          method: "PATCH",
          url: `/api/playlists/${playlistId}/exercises/${item.id}`,
          data: {
            targetWeightKg: toWeight(values.targetWeightKg),
            targetSets: toInteger(values.targetSets),
            targetRepsMin: toInteger(values.targetRepsMin),
            targetRepsMax: toInteger(values.targetRepsMax),
            restSeconds: toInteger(values.restSeconds),
            note: values.note.trim(),
          },
        },
        playlistExerciseSchema,
      );
      onSaved();
    } catch (failure) {
      setFormError(describeApiError(failure));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className={styles.itemForm} onSubmit={handleSubmit} noValidate>
      {formError ? <Notice tone="error">{formError}</Notice> : null}

      <div className={styles.itemFormGrid}>
        <Field
          id={`weight-${item.id}`}
          label="Weight (kg)"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.5"
          autoFocus
          value={values.targetWeightKg}
          error={errors.targetWeightKg}
          onChange={(event) => setField("targetWeightKg", event.target.value)}
        />
        <Field
          id={`sets-${item.id}`}
          label="Sets"
          type="number"
          inputMode="numeric"
          min={1}
          max={20}
          value={values.targetSets}
          error={errors.targetSets}
          onChange={(event) => setField("targetSets", event.target.value)}
        />
        <Field
          id={`reps-min-${item.id}`}
          label="Min reps"
          type="number"
          inputMode="numeric"
          min={1}
          value={values.targetRepsMin}
          error={errors.targetRepsMin}
          onChange={(event) => setField("targetRepsMin", event.target.value)}
        />
        <Field
          id={`reps-max-${item.id}`}
          label="Max reps"
          type="number"
          inputMode="numeric"
          min={1}
          value={values.targetRepsMax}
          error={errors.targetRepsMax}
          onChange={(event) => setField("targetRepsMax", event.target.value)}
        />
        <Field
          id={`rest-${item.id}`}
          label="Rest (s)"
          type="number"
          inputMode="numeric"
          min={0}
          max={600}
          value={values.restSeconds}
          error={errors.restSeconds}
          onChange={(event) => setField("restSeconds", event.target.value)}
        />
        <div className={styles.itemFormWide}>
          <Field
            id={`note-${item.id}`}
            label="Note"
            hint="Optional, up to 500 characters"
            maxLength={500}
            value={values.note}
            error={errors.note}
            onChange={(event) => setField("note", event.target.value)}
          />
        </div>
      </div>

      <div className={styles.formActions}>
        <Button type="submit" isLoading={isSaving}>
          Save targets
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
