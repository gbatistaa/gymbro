"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Skeleton } from "@/components/ui/skeleton";
import { exerciseSchema, type Exercise } from "@/contracts/exercise";
import { pageSchema } from "@/contracts/page";
import { playlistExerciseSchema } from "@/contracts/playlist";
import { describeApiError } from "@/lib/api-error-text";
import { request } from "@/lib/http";
import styles from "./train.module.css";

type ExercisePickerProps = {
  playlistId: string;
  onAdded: () => void;
  onCancel: () => void;
};

export function ExercisePicker({
  playlistId,
  onAdded,
  onCancel,
}: ExercisePickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Exercise[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSearching) return;

    setSearchError(null);
    setAddError(null);
    setIsSearching(true);

    try {
      const page = await request(
        {
          url: "/api/exercises",
          params: {
            q: query.trim() || undefined,
            includeArchived: false,
            page: 0,
            size: 20,
            sort: "name",
          },
        },
        pageSchema(exerciseSchema),
      );
      setResults(page.content);
    } catch (failure) {
      setSearchError(describeApiError(failure));
    } finally {
      setIsSearching(false);
    }
  }

  async function addExercise(exercise: Exercise) {
    if (addingId) return;

    setAddError(null);
    setAddingId(exercise.id);

    try {
      await request(
        {
          method: "POST",
          url: `/api/playlists/${playlistId}/exercises`,
          data: {
            exerciseId: exercise.id,
            targetSets: 3,
            targetRepsMin: 8,
            targetRepsMax: 12,
            restSeconds: 90,
          },
        },
        playlistExerciseSchema,
      );
      onAdded();
    } catch (failure) {
      setAddError(describeApiError(failure));
    } finally {
      setAddingId(null);
    }
  }

  return (
    <section className={styles.picker}>
      <form className={styles.pickerForm} onSubmit={handleSearch} noValidate>
        <div className={styles.pickerField}>
          <Field
            id="exercise-search"
            label="Buscar exercício"
            type="search"
            autoFocus
            value={query}
            placeholder="Ex.: supino"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Button type="submit" isLoading={isSearching}>
          Buscar
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Fechar
        </Button>
      </form>

      {searchError ? <Notice tone="error">{searchError}</Notice> : null}
      {addError ? <Notice tone="error">{addError}</Notice> : null}

      {isSearching ? (
        <Skeleton lines={2} label="Buscando exercícios…" />
      ) : results === null ? (
        <p className={styles.muted}>Busque pelo nome para adicionar um exercício.</p>
      ) : results.length === 0 ? (
        <p className={styles.muted}>Nenhum exercício encontrado.</p>
      ) : (
        <ul className={styles.pickerList}>
          {results.map((exercise) => (
            <li key={exercise.id} className={styles.pickerRow}>
              <div className={styles.pickerInfo}>
                <span className={styles.pickerName}>{exercise.name}</span>
                <span className={styles.pickerMeta}>
                  {exercise.primaryMuscle}
                  {exercise.equipment ? ` · ${exercise.equipment}` : ""}
                </span>
              </div>
              <Button
                variant="secondary"
                aria-label={`Adicionar ${exercise.name}`}
                isLoading={addingId === exercise.id}
                disabled={addingId !== null && addingId !== exercise.id}
                onClick={() => addExercise(exercise)}
              >
                Adicionar
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
