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

/** Mesmos campos do `CreateExerciseDto`/`UpdateExerciseDto`; o id vem por path, não no corpo. */
export type ExerciseInput = {
  name: string;
  primaryMuscle: string;
  secondaryMuscle?: string;
  equipment?: string;
  incrementKg?: number;
};

export async function createExercise(client: ApiClient, input: ExerciseInput): Promise<Exercise> {
  return client.request<Exercise>('/api/exercises', { method: 'POST', body: input });
}

export async function updateExercise(
  client: ApiClient,
  id: string,
  input: ExerciseInput,
): Promise<Exercise> {
  return client.request<Exercise>(`/api/exercises/${id}`, { method: 'PUT', body: input });
}

/** O backend arquiva (soft delete): o histórico continua íntegro. Sem corpo na resposta. */
export async function archiveExercise(client: ApiClient, id: string): Promise<void> {
  await client.request<void>(`/api/exercises/${id}`, { method: 'DELETE' });
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
