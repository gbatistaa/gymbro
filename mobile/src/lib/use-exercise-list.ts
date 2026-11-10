import { useCallback, useEffect, useRef, useState } from 'react';

import type { Exercise, ExercisePage } from '@/lib/api/exercises';

export type ExerciseListStatus = 'loading' | 'ready' | 'error';

export type FetchExercisePage = (page: number, query: string) => Promise<ExercisePage>;

export type ExerciseList = {
  status: ExerciseListStatus;
  items: Exercise[];
  hasMore: boolean;
  loadMore(): Promise<void>;
};

/**
 * Lista paginada de exercícios com busca.
 *
 * O merge é por `id`, não por posição: se o backend devolver um item nas duas páginas (limite de
 * janela entre requests), posição duplicaria e id não. `hasMore` vem de `totalPages`, nunca de
 * "a última página veio cheia" — página cheia não prova que existe próxima.
 */
export function useExerciseList(
  fetchPage: FetchExercisePage,
  query: string = '',
): ExerciseList {
  const [status, setStatus] = useState<ExerciseListStatus>('loading');
  const [items, setItems] = useState<Exercise[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [nextPage, setNextPage] = useState(0);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const requestId = (requestIdRef.current += 1);
    loadingRef.current = true;
    setStatus('loading');
    setItems([]);
    setTotalPages(0);
    setNextPage(0);

    fetchPage(0, query).then(
      (page) => {
        // resposta velha de uma busca anterior não pode sobrescrever a atual
        if (cancelled || requestIdRef.current !== requestId) {
          return;
        }
        setItems(page.content);
        setTotalPages(page.totalPages);
        setNextPage(1);
        setStatus('ready');
      },
      () => {
        if (cancelled || requestIdRef.current !== requestId) {
          return;
        }
        setStatus('error');
      },
    ).finally(() => {
      if (!cancelled && requestIdRef.current === requestId) {
        loadingRef.current = false;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [fetchPage, query]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || nextPage >= totalPages) {
      return;
    }
    loadingRef.current = true;
    try {
      const page = await fetchPage(nextPage, query);
      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...page.content.filter((item) => !seen.has(item.id))];
      });
      setTotalPages(page.totalPages);
      setNextPage(nextPage + 1);
    } catch {
      setStatus('error');
    } finally {
      loadingRef.current = false;
    }
  }, [fetchPage, nextPage, query, totalPages]);

  return { status, items, hasMore: nextPage < totalPages, loadMore };
}
