import { atom, getDefaultStore } from 'jotai';

import type { Exercise } from '@/lib/api/exercises';

/**
 * Exercícios já carregados, por id.
 *
 * Existe porque o backend **não expõe** `GET /api/exercises/{id}` — a tela de edição só tem o que a
 * lista trouxe. Quem abre a edição por link direto, sem passar pela lista, cai no "não encontrado"
 * em vez de fazer uma chamada que não existe.
 */
export const exerciseCacheAtom = atom<Record<string, Exercise>>({});

const store = getDefaultStore();

export function rememberExercises(exercises: Exercise[]): void {
  if (exercises.length === 0) {
    return;
  }
  store.set(exerciseCacheAtom, (current) => {
    const next = { ...current };
    for (const exercise of exercises) {
      next[exercise.id] = exercise;
    }
    return next;
  });
}

export function findExercise(id: string): Exercise | undefined {
  return store.get(exerciseCacheAtom)[id];
}
