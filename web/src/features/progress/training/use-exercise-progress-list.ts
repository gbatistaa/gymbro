"use client";

import { useState } from "react";
import type { ExerciseProgressPage, ExerciseProgressSort, SortDirection } from "@/contracts/progress";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useResource } from "@/lib/use-resource";
import { fetchExerciseProgress } from "../progress-api";

const PAGE_SIZE = 10;

export type ExerciseProgressFilters = {
  search: string;
  muscle: string;
  sort: ExerciseProgressSort;
  direction: SortDirection;
};

export const DEFAULT_FILTERS: ExerciseProgressFilters = {
  search: "",
  muscle: "",
  sort: "LAST_PERFORMED_AT",
  direction: "DESC",
};

type PageState = { filterKey: string; page: number };

export type ExerciseProgressList = {
  filters: ExerciseProgressFilters;
  setFilters: (filters: ExerciseProgressFilters) => void;
  page: number;
  setPage: (page: number) => void;
  /** Dado atual ou, enquanto o próximo pedido carrega, o anterior. */
  result: ExerciseProgressPage | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
  hasActiveFilters: boolean;
};

/**
 * Estado da lista de progresso. A busca espera 300 ms sem digitação; mudar qualquer filtro volta à
 * primeira página, derivado no render (sem efeito sincronizando estado).
 */
export function useExerciseProgressList(refreshToken: number): ExerciseProgressList {
  const [filters, setFilters] = useState<ExerciseProgressFilters>(DEFAULT_FILTERS);
  const search = useDebouncedValue(filters.search.trim(), 300);
  const filterKey = [search, filters.muscle, filters.sort, filters.direction].join("|");
  const [pageState, setPageState] = useState<PageState>({ filterKey, page: 0 });
  const page = pageState.filterKey === filterKey ? pageState.page : 0;

  const resource = useResource(`progress:exercises:${filterKey}|${page}|${refreshToken}`, () =>
    fetchExerciseProgress({
      search,
      muscle: filters.muscle,
      sort: filters.sort,
      direction: filters.direction,
      page,
      size: PAGE_SIZE,
    }),
  );

  return {
    filters,
    setFilters,
    page,
    setPage: (next) => setPageState({ filterKey, page: next }),
    result: resource.data ?? resource.lastData,
    isLoading: resource.isLoading,
    error: resource.error,
    reload: resource.reload,
    hasActiveFilters: search !== "" || filters.muscle !== "",
  };
}
