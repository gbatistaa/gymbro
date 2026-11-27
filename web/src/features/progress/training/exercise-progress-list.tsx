"use client";

import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCount } from "@/lib/format";
import { useResource } from "@/lib/use-resource";
import { fetchMuscles } from "../progress-api";
import styles from "../progress.module.css";
import type { EvolutionTarget } from "./exercise-evolution-modal";
import { ExerciseProgressFilters } from "./exercise-progress-filters";
import { ExerciseProgressRow } from "./exercise-progress-row";
import { DEFAULT_FILTERS, useExerciseProgressList } from "./use-exercise-progress-list";

type ExerciseProgressListProps = {
  refreshToken: number;
  timeZone: string;
  onOpenExercise: (exercise: EvolutionTarget) => void;
};

/** Todos os exercícios já treinados, com filtros, ordenação e paginação. */
export function ExerciseProgressList({ refreshToken, timeZone, onOpenExercise }: ExerciseProgressListProps) {
  const list = useExerciseProgressList(refreshToken);
  const muscles = useResource("exercise-muscles", fetchMuscles);
  const { result } = list;

  return (
    <section className={styles.section} aria-labelledby="exercises-title">
      <div className={styles.sectionHeader}>
        <h2 id="exercises-title" className={styles.sectionTitle}>Exercícios</h2>
        {result !== null && result.totalElements > 0 ? (
          <span className={styles.sectionCount}>
            {formatCount(result.totalElements)} {result.totalElements === 1 ? "exercício" : "exercícios"}
          </span>
        ) : null}
      </div>

      <ExerciseProgressFilters
        filters={list.filters}
        muscles={muscles.data ?? []}
        onChange={list.setFilters}
      />

      {list.error ? (
        <ErrorState message={list.error} onRetry={list.reload} />
      ) : result === null ? (
        <Skeleton lines={5} label="Carregando exercícios…" />
      ) : result.totalElements === 0 ? (
        list.hasActiveFilters ? (
          <EmptyState
            title="Nenhum exercício com esses filtros"
            action={
              <Button variant="secondary" onClick={() => list.setFilters(DEFAULT_FILTERS)}>
                Limpar filtros
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="Nenhum treino registrado ainda"
            description="Registre um treino numa ficha para acompanhar a evolução de cada exercício."
            action={<ButtonLink href="/treinar">Ver fichas</ButtonLink>}
          />
        )
      ) : (
        <>
          <ul className={styles.exerciseList} aria-busy={list.isLoading || undefined}>
            {result.content.map((exercise) => (
              <li key={exercise.exerciseId}>
                <ExerciseProgressRow
                  exercise={exercise}
                  sort={list.filters.sort}
                  timeZone={timeZone}
                  onOpen={() => onOpenExercise(exercise)}
                />
              </li>
            ))}
          </ul>
          <Pagination
            page={list.page}
            totalPages={result.totalPages}
            onChange={list.setPage}
            isDisabled={list.isLoading}
          />
        </>
      )}
    </section>
  );
}
