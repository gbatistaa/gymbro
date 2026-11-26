"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Modal } from "@/components/ui/modal";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { completionSchema, type Completion } from "@/contracts/completion";
import { playlistDetailSchema, type PlaylistDetail } from "@/contracts/playlist";
import { describeApiError } from "@/lib/api-error-text";
import { request } from "@/lib/http";
import { useResource } from "@/lib/use-resource";
import { entryFromPlanItem, validateEntries } from "./exercise-entries";
import { ExerciseEntryList } from "./exercise-entry-list";
import { ExerciseSearch } from "./exercise-search";
import styles from "./plans.module.css";
import { useExerciseEntries } from "./use-exercise-entries";

type LogWorkoutModalProps = {
  planId: string;
  planName: string;
  onLogged: (completion: Completion) => void;
  onClose: () => void;
};

/** Logs what was actually lifted for a plan. No timer: only weight, sets and reps per exercise. */
export function LogWorkoutModal({ planId, planName, onLogged, onClose }: LogWorkoutModalProps) {
  const plan = useResource(`plan:${planId}`, () =>
    request({ url: `/api/playlists/${planId}` }, playlistDetailSchema),
  );

  return (
    <Modal
      title={`Log workout · ${planName}`}
      description="Adjust what you actually did. Each set counts toward your volume and records."
      size="large"
      onClose={onClose}
    >
      {plan.isLoading ? (
        <Skeleton lines={4} label="Loading plan…" />
      ) : plan.error || !plan.data ? (
        <ErrorState message={plan.error ?? "Could not load the plan."} onRetry={plan.reload} />
      ) : (
        <LogWorkoutForm plan={plan.data} onLogged={onLogged} onClose={onClose} />
      )}
    </Modal>
  );
}

type LogWorkoutFormProps = {
  plan: PlaylistDetail;
  onLogged: (completion: Completion) => void;
  onClose: () => void;
};

function LogWorkoutForm({ plan, onLogged, onClose }: LogWorkoutFormProps) {
  const exercises = useExerciseEntries(plan.exercises.map(entryFromPlanItem));
  const [isAdding, setIsAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function save() {
    if (isSaving) return;

    const validated = validateEntries(exercises.entries);
    if (!validated.ok) {
      exercises.setErrors(validated.errors);
      return;
    }

    exercises.setErrors({});
    setFormError(null);
    setIsSaving(true);

    try {
      const completion = await request(
        {
          method: "POST",
          url: `/api/playlists/${plan.id}/completions`,
          data: { exercises: validated.values },
        },
        completionSchema,
      );
      onLogged(completion);
    } catch (failure) {
      setFormError(describeApiError(failure));
    } finally {
      setIsSaving(false);
    }
  }

  const hasExercises = exercises.entries.length > 0;

  return (
    <>
      {formError ? <Notice tone="error">{formError}</Notice> : null}

      <p className={styles.sectionTitle}>Exercises · {exercises.entries.length}</p>
      <ExerciseEntryList
        entries={exercises.entries}
        errors={exercises.errors}
        emptyText="This plan has no exercises. Add what you did, or just mark it as done."
        onChange={exercises.update}
        onRemove={exercises.remove}
      />

      {isAdding ? (
        <ExerciseSearch
          excludedIds={exercises.excludedIds}
          onSelect={(exercise) => {
            exercises.add(exercise);
            setIsAdding(false);
          }}
        />
      ) : (
        <button type="button" className={styles.textButton} onClick={() => setIsAdding(true)}>
          + Add another exercise
        </button>
      )}

      <div className={styles.inlineActions}>
        <Button onClick={save} isLoading={isSaving}>
          {hasExercises ? "Save workout" : "Mark as done"}
        </Button>
        <Button variant="secondary" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </>
  );
}
