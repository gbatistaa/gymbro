"use client";

import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SelectField } from "@/components/ui/select-field";
import { EXERCISE_PROGRESS_SORTS, type ExerciseProgressSort } from "@/contracts/progress";
import styles from "../progress.module.css";
import type { ExerciseProgressFilters as Filters } from "./use-exercise-progress-list";

export const SORT_LABELS: Record<ExerciseProgressSort, string> = {
  LAST_PERFORMED_AT: "Último treino",
  NAME: "Nome",
  SESSION_COUNT: "Sessões",
  TOTAL_SETS: "Séries",
  TOTAL_VOLUME: "Volume total",
  BEST_WEIGHT: "Carga máxima",
  BEST_E1RM: "1RM estimado",
};

function isSort(value: string): value is ExerciseProgressSort {
  return EXERCISE_PROGRESS_SORTS.some((sort) => sort === value);
}

type ExerciseProgressFiltersProps = {
  filters: Filters;
  muscles: readonly string[];
  onChange: (filters: Filters) => void;
};

/** Busca, músculo, coluna e direção da ordenação, numa linha acima da lista. */
export function ExerciseProgressFilters({ filters, muscles, onChange }: ExerciseProgressFiltersProps) {
  const searchId = useId();
  const muscleId = useId();
  const sortId = useId();
  const isDescending = filters.direction === "DESC";

  return (
    <div className={styles.filters}>
      <div className={styles.filterSearch}>
        <Field
          id={searchId}
          label="Buscar"
          type="search"
          placeholder="Nome do exercício"
          autoComplete="off"
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
        />
      </div>
      <SelectField
        id={muscleId}
        label="Músculo"
        value={filters.muscle}
        onChange={(event) => onChange({ ...filters, muscle: event.target.value })}
      >
        <option value="">Todos</option>
        {muscles.map((muscle) => (
          <option key={muscle} value={muscle}>
            {muscle}
          </option>
        ))}
      </SelectField>
      <div className={styles.filterSort}>
        <SelectField
          id={sortId}
          label="Ordenar por"
          value={filters.sort}
          onChange={(event) => {
            if (isSort(event.target.value)) onChange({ ...filters, sort: event.target.value });
          }}
        >
          {EXERCISE_PROGRESS_SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {SORT_LABELS[sort]}
            </option>
          ))}
        </SelectField>
        <Button
          variant="secondary"
          size="icon"
          className={styles.directionButton}
          aria-label={isDescending ? "Ordem decrescente. Trocar para crescente" : "Ordem crescente. Trocar para decrescente"}
          onClick={() => onChange({ ...filters, direction: isDescending ? "ASC" : "DESC" })}
        >
          {isDescending ? (
            <ArrowDownWideNarrow size={18} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <ArrowUpNarrowWide size={18} strokeWidth={1.75} aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
}
