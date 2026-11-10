import { useCallback, useEffect, useRef, useState } from 'react';

import type { Exercise, ExercisePage } from '@/lib/api/exercises';

export type ExerciseListStatus = 'loading' | 'ready' | 'error';

export type FetchExercisePage = (page: number, query: string) => Promise<ExercisePage>;

export type ExerciseList = {
  status: ExerciseListStatus;
  items: Exercise[];
  hasMore: boolean;
  loadMore(): Promise<void>;
  /** Recarrega a busca atual da página zero. */
  retry(): void;
};

type ListState = {
  status: ExerciseListStatus;
  items: Exercise[];
  totalPages: number;
  nextPage: number;
};

const INITIAL: ListState = { status: 'loading', items: [], totalPages: 0, nextPage: 0 };

/**
 * Lista paginada de exercícios com busca.
 *
 * Estado único em vez de quatro `useState`: recarregar a busca trocaria os quatro de uma vez e a
 * regra `react-hooks/set-state-in-effect` proíbe setStates em cascata no efeito.
 *
 * O merge é por `id`, não por posição: se o backend devolver um item nas duas páginas (limite de
 * janela entre requests), posição duplicaria e id não. `hasMore` vem de `totalPages`, nunca de
 * "a última página veio cheia" — página cheia não prova que existe próxima.
 */
export function useExerciseList(
  fetchPage: FetchExercisePage,
  query: string = '',
): ExerciseList {
  const [state, setState] = useState<ListState>(INITIAL);
  const [generation, setGeneration] = useState({ query, retry: 0 });
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);

  // reset na fase de render (padrão documentado do React para "reagir a prop mudada"): a regra
  // react-hooks/set-state-in-effect proíbe fazer isto dentro do efeito, e sem o reset a troca de
  // busca mostraria os itens velhos como se fossem os novos
  if (generation.query !== query) {
    setGeneration({ query, retry: 0 });
    setState(INITIAL);
  }

  useEffect(() => {
    let cancelled = false;
    const requestId = (requestIdRef.current += 1);
    loadingRef.current = true;

    fetchPage(0, generation.query).then(
      (page) => {
        // resposta velha de uma busca anterior não pode sobrescrever a atual
        if (cancelled || requestIdRef.current !== requestId) {
          return;
        }
        setState({ status: 'ready', items: page.content, totalPages: page.totalPages, nextPage: 1 });
      },
      () => {
        if (cancelled || requestIdRef.current !== requestId) {
          return;
        }
        setState({ status: 'error', items: [], totalPages: 0, nextPage: 0 });
      },
    ).finally(() => {
      if (!cancelled && requestIdRef.current === requestId) {
        loadingRef.current = false;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [fetchPage, generation]);

  const retry = useCallback(() => {
    setGeneration((current) => ({ ...current, retry: current.retry + 1 }));
    setState(INITIAL);
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || state.nextPage >= state.totalPages) {
      return;
    }
    loadingRef.current = true;
    try {
      const page = await fetchPage(state.nextPage, generation.query);
      setState((current) => {
        const seen = new Set(current.items.map((item) => item.id));
        return {
          status: 'ready',
          items: [...current.items, ...page.content.filter((item) => !seen.has(item.id))],
          totalPages: page.totalPages,
          nextPage: current.nextPage + 1,
        };
      });
    } catch {
      setState((current) => ({ ...current, status: 'error' }));
    } finally {
      loadingRef.current = false;
    }
  }, [fetchPage, generation.query, state.nextPage, state.totalPages]);

  return {
    status: state.status,
    items: state.items,
    hasMore: state.nextPage < state.totalPages,
    loadMore,
    retry,
  };
}
