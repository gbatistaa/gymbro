import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useExerciseList } from '../use-exercise-list';
import type { ExercisePage } from '@/lib/api/exercises';

function pageOf(ids: string[], page: number, totalPages: number): ExercisePage {
  return {
    content: ids.map((id) => ({ id, name: `Exercício ${id}`, primaryMuscle: 'CHEST' })),
    page,
    size: 2,
    totalElements: ids.length,
    totalPages,
  };
}

describe('useExerciseList', () => {
  it('loads the first page on mount', async () => {
    const fetchPage = jest.fn(async () => pageOf(['a', 'b'], 0, 2));

    const { result } = await renderHook(() => useExerciseList(fetchPage));

    await waitFor(() => expect(result.current?.status).toBe('ready'));

    expect(result.current?.items.map((item) => item.id)).toEqual(['a', 'b']);
    expect(result.current?.hasMore).toBe(true);
  });

  it('appends the next page without duplicating items', async () => {
    const fetchPage = jest.fn(async (page: number) =>
      page === 0 ? pageOf(['a', 'b'], 0, 2) : pageOf(['b', 'c'], 1, 2),
    );

    const { result } = await renderHook(() => useExerciseList(fetchPage));

    await waitFor(() => expect(result.current?.status).toBe('ready'));

    await act(async () => {
      await result.current?.loadMore();
    });

    expect(fetchPage).toHaveBeenCalledWith(1, '');
    expect(result.current?.items.map((item) => item.id)).toEqual(['a', 'b', 'c']);
    expect(result.current?.hasMore).toBe(false);
  });

  it('does nothing when there are no more pages or a load is in flight', async () => {
    const fetchPage = jest.fn(async () => pageOf(['a'], 0, 1));

    const { result } = await renderHook(() => useExerciseList(fetchPage));

    await waitFor(() => expect(result.current?.status).toBe('ready'));

    await act(async () => {
      await result.current?.loadMore();
    });

    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('resets to the first page when the query changes', async () => {
    const fetchPage = jest.fn(async (page: number, query: string) =>
      pageOf(query === '' ? ['a'] : ['z'], 0, 1),
    );

    const { result, rerender } = await renderHook(
      ({ query }: { query: string }) => useExerciseList(fetchPage, query),
      { initialProps: { query: '' } },
    );

    await waitFor(() => expect(result.current?.status).toBe('ready'));
    expect(result.current?.items.map((item) => item.id)).toEqual(['a']);

    await rerender({ query: 'supino' });

    await waitFor(() => expect(result.current?.items.map((item) => item.id)).toEqual(['z']));
    expect(fetchPage).toHaveBeenLastCalledWith(0, 'supino');
  });

  it('reports an error without losing the items already loaded', async () => {
    const fetchPage = jest.fn(async (page: number) => {
      if (page > 0) {
        throw new Error('boom');
      }
      return pageOf(['a'], 0, 2);
    });

    const { result } = await renderHook(() => useExerciseList(fetchPage));

    await waitFor(() => expect(result.current?.status).toBe('ready'));

    await act(async () => {
      await result.current?.loadMore();
    });

    expect(result.current?.status).toBe('error');
    expect(result.current?.items.map((item) => item.id)).toEqual(['a']);
  });
});

describe('useExerciseList — retry', () => {
  function pageOfRetry(ids: string[]): ExercisePage {
    return {
      content: ids.map((id) => ({ id, name: `Exercício ${id}`, primaryMuscle: 'CHEST' })),
      page: 0,
      size: 2,
      totalElements: ids.length,
      totalPages: 1,
    };
  }

  it('reloads the first page when the initial load failed', async () => {
    let attempts = 0;
    const fetchPage = jest.fn(async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error('boom');
      }
      return pageOfRetry(['a']);
    });

    const { result } = await renderHook(() => useExerciseList(fetchPage));

    await waitFor(() => expect(result.current?.status).toBe('error'));

    await act(async () => {
      result.current?.retry();
    });

    await waitFor(() => expect(result.current?.status).toBe('ready'));
    expect(result.current?.items.map((item) => item.id)).toEqual(['a']);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });
});
