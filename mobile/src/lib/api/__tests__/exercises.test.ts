import type { ApiClient } from '../client';
import { listExercises } from '../exercises';

function stubClient(result: unknown) {
  const calls: { path: string; options?: { query?: Record<string, string | number | boolean | undefined> } }[] = [];
  const client = {
    async request<T>(path: string, options?: { query?: Record<string, string | number | boolean | undefined> }) {
      calls.push({ path, options });
      return result as T;
    },
  } as unknown as ApiClient;
  return { client, calls };
}

const PAGE = {
  content: [{ id: 'e1', name: 'Supino reto', primaryMuscle: 'CHEST' }],
  page: 0,
  size: 20,
  totalElements: 1,
  totalPages: 1,
};

describe('listExercises', () => {
  it('calls the search endpoint with the query parameters', async () => {
    const { client, calls } = stubClient(PAGE);

    const result = await listExercises(client, { q: 'supino', page: 0, size: 20 });

    expect(calls[0].path).toBe('/api/exercises');
    expect(calls[0].options?.query).toEqual({ q: 'supino', muscle: undefined, includeArchived: undefined, page: 0, size: 20 });
    expect(result.content).toHaveLength(1);
  });

  it('omits parameters that were not provided', async () => {
    const { client, calls } = stubClient(PAGE);

    await listExercises(client, {});

    expect(calls[0].options?.query ?? {}).toEqual({});
  });

  it('normalizes a missing content array into an empty list', async () => {
    const { client } = stubClient({ page: 0, size: 20, totalElements: 0, totalPages: 0 });

    const result = await listExercises(client, {});

    expect(result.content).toEqual([]);
    expect(result.totalPages).toBe(0);
  });
});
