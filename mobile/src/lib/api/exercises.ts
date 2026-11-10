import type { ApiClient } from './client';

export type Exercise = {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscle?: string;
  equipment?: string;
  incrementKg?: number;
};

export type ExercisePage = {
  content: Exercise[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type ExerciseSearch = {
  q?: string;
  muscle?: string;
  includeArchived?: boolean;
  page?: number;
  size?: number;
};

/** Mesmos nomes do contrato (`q`, `page`, `size`): a query espelha a API, sem tradução. */
export async function listExercises(client: ApiClient, search: ExerciseSearch): Promise<ExercisePage> {
  const page = await client.request<{
    content?: Exercise[];
    page?: number;
    size?: number;
    totalElements?: number;
    totalPages?: number;
  }>('/api/exercises', { query: narrow(search) });

  return {
    content: page.content ?? [],
    page: page.page ?? 0,
    size: page.size ?? 0,
    totalElements: page.totalElements ?? 0,
    totalPages: page.totalPages ?? 0,
  };
}

function narrow(search: ExerciseSearch): Record<string, string | number | boolean | undefined> {
  return {
    q: search.q,
    muscle: search.muscle,
    includeArchived: search.includeArchived,
    page: search.page,
    size: search.size,
  };
}
