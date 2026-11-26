"use client";

import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { SelectField } from "@/components/ui/select-field";
import { Skeleton } from "@/components/ui/skeleton";
import { exerciseSchema, type Exercise } from "@/contracts/exercise";
import { pageSchema } from "@/contracts/page";
import { describeApiError } from "@/lib/api-error-text";
import { request } from "@/lib/http";
import { useResource } from "@/lib/use-resource";
import styles from "./plans.module.css";

const newExerciseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Use at least 3 characters.")
    .max(225, "Use at most 225 characters."),
  primaryMuscle: z.string().trim().min(1, "Choose the target muscle."),
});

type ExerciseSearchProps = {
  /** Exercises already chosen; they are hidden from the results. */
  excludedIds: ReadonlySet<string>;
  /** Id of the exercise being added, when adding is asynchronous. */
  pendingId?: string | null;
  onSelect: (exercise: Exercise) => void;
};

function loadExercises(query: string): Promise<Exercise[]> {
  return request(
    {
      url: "/api/exercises",
      params: {
        q: query || undefined,
        includeArchived: false,
        page: 0,
        size: 30,
        sort: "name",
      },
    },
    pageSchema(exerciseSchema),
  ).then((page) => page.content);
}

/** Search the exercise library, or create a new exercise with its target muscle. */
export function ExerciseSearch({ excludedIds, pendingId = null, onSelect }: ExerciseSearchProps) {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const results = useResource(`exercise-search:${submittedQuery}`, () =>
    loadExercises(submittedQuery),
  );

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(query.trim());
  }

  function handleCreated(exercise: Exercise) {
    setIsCreating(false);
    onSelect(exercise);
  }

  const visible = (results.data ?? []).filter((exercise) => !excludedIds.has(exercise.id));

  return (
    <div className={styles.search}>
      <form className={styles.searchForm} role="search" onSubmit={handleSearch} noValidate>
        <Field
          id="exercise-search"
          label="Find an exercise"
          type="search"
          placeholder="e.g. bench press"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {results.isLoading ? (
        <Skeleton lines={3} label="Searching exercises…" />
      ) : results.error ? (
        <Notice tone="error">{results.error}</Notice>
      ) : visible.length === 0 ? (
        <p className={styles.emptyHint}>No exercises found. Create a new one below.</p>
      ) : (
        <ul className={styles.resultList}>
          {visible.map((exercise) => (
            <li key={exercise.id} className={styles.resultRow}>
              <span>
                <span className={styles.resultName}>{exercise.name}</span>
                <span className={styles.exerciseMeta}>
                  {exercise.primaryMuscle}
                  {exercise.equipment ? ` · ${exercise.equipment}` : ""}
                </span>
              </span>
              <Button
                variant="ghost"
                aria-label={`Add ${exercise.name}`}
                isLoading={pendingId === exercise.id}
                disabled={pendingId !== null && pendingId !== exercise.id}
                onClick={() => onSelect(exercise)}
              >
                <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
                Add
              </Button>
            </li>
          ))}
        </ul>
      )}

      {isCreating ? (
        <NewExerciseForm
          initialName={query}
          onCreated={handleCreated}
          onCancel={() => setIsCreating(false)}
        />
      ) : (
        <button type="button" className={styles.textButton} onClick={() => setIsCreating(true)}>
          + Create a new exercise
        </button>
      )}
    </div>
  );
}

type NewExerciseFormProps = {
  initialName: string;
  onCreated: (exercise: Exercise) => void;
  onCancel: () => void;
};

type NewExerciseErrors = Partial<Record<"name" | "primaryMuscle", string>>;

function NewExerciseForm({ initialName, onCreated, onCancel }: NewExerciseFormProps) {
  const muscles = useResource("exercise-muscles", () =>
    request({ url: "/api/exercises/muscles" }, z.array(z.string())),
  );
  const [name, setName] = useState(initialName);
  const [muscle, setMuscle] = useState("");
  const [errors, setErrors] = useState<NewExerciseErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const parsed = newExerciseSchema.safeParse({ name, primaryMuscle: muscle });
    if (!parsed.success) {
      const nextErrors: NewExerciseErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if ((field === "name" || field === "primaryMuscle") && nextErrors[field] === undefined) {
          nextErrors[field] = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setFormError(null);
    setIsSaving(true);

    try {
      const created = await request(
        { method: "POST", url: "/api/exercises", data: parsed.data },
        exerciseSchema,
      );
      onCreated(created);
    } catch (failure) {
      setFormError(describeApiError(failure));
    } finally {
      setIsSaving(false);
    }
  }

  const muscleOptions = muscles.data ?? [];

  return (
    <form className={styles.createExercise} onSubmit={handleSubmit} noValidate>
      <p className={styles.sectionTitle}>New exercise</p>
      {formError ? <Notice tone="error">{formError}</Notice> : null}

      <Field
        id="new-exercise-name"
        label="Name"
        value={name}
        error={errors.name}
        onChange={(event) => setName(event.target.value)}
      />

      {muscleOptions.length > 0 ? (
        <SelectField
          id="new-exercise-muscle"
          label="Target muscle"
          value={muscle}
          error={errors.primaryMuscle}
          onChange={(event) => setMuscle(event.target.value)}
        >
          <option value="">Choose a muscle</option>
          {muscleOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </SelectField>
      ) : (
        <Field
          id="new-exercise-muscle"
          label="Target muscle"
          placeholder="e.g. Chest"
          value={muscle}
          error={errors.primaryMuscle}
          onChange={(event) => setMuscle(event.target.value)}
        />
      )}

      {muscle ? (
        <span>
          <Badge tone="primary">{muscle}</Badge>
        </span>
      ) : null}

      <div className={styles.inlineActions}>
        <Button type="submit" isLoading={isSaving}>
          Create and add
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
