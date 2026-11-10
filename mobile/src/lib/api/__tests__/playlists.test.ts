import type { ApiClient } from '../client';
import {
  archivePlaylist,
  clonePlaylist,
  createPlaylist,
  listPlaylists,
} from '../playlists';

function stubClient(result: unknown) {
  const calls: { path: string; options?: { method?: string; body?: unknown; query?: Record<string, unknown> } }[] = [];
  const client = {
    async request<T>(path: string, options?: { method?: string; body?: unknown; query?: Record<string, unknown> }) {
      calls.push({ path, options });
      return result as T;
    },
  } as unknown as ApiClient;
  return { client, calls };
}

const PLAYLIST = { id: 'p1', name: 'Push', description: 'Peito e ombro' };

describe('listPlaylists', () => {
  it('lists without includeArchived by default', async () => {
    const { client, calls } = stubClient([PLAYLIST]);

    const result = await listPlaylists(client, {});

    expect(calls[0].path).toBe('/api/playlists');
    expect(calls[0].options?.query ?? {}).toEqual({ includeArchived: undefined });
    expect(result).toHaveLength(1);
  });

  it('asks for archived ones when requested', async () => {
    const { client, calls } = stubClient([PLAYLIST]);

    await listPlaylists(client, { includeArchived: true });

    expect(calls[0].options?.query).toEqual({ includeArchived: true });
  });

  it('normalizes a missing body into an empty list', async () => {
    const { client } = stubClient(undefined);

    await expect(listPlaylists(client, {})).resolves.toEqual([]);
  });
});

describe('createPlaylist', () => {
  it('posts name and description', async () => {
    const { client, calls } = stubClient(PLAYLIST);

    const result = await createPlaylist(client, { name: 'Push', description: 'Peito e ombro' });

    expect(calls[0].path).toBe('/api/playlists');
    expect(calls[0].options).toMatchObject({
      method: 'POST',
      body: { name: 'Push', description: 'Peito e ombro' },
    });
    expect(result.id).toBe('p1');
  });
});

describe('clonePlaylist', () => {
  it('posts to the clone path without a body', async () => {
    const { client, calls } = stubClient({ id: 'p2', name: 'Push (cópia)' });

    const result = await clonePlaylist(client, 'p1');

    expect(calls[0].path).toBe('/api/playlists/p1/clone');
    expect(calls[0].options).toMatchObject({ method: 'POST' });
    expect(result.name).toBe('Push (cópia)');
  });
});

describe('archivePlaylist', () => {
  it('posts to the archive path, because the backend soft-deletes with POST', async () => {
    const { client, calls } = stubClient({ id: 'p1', archivedAt: '2026-01-01T00:00:00Z' });

    const result = await archivePlaylist(client, 'p1');

    expect(calls[0].path).toBe('/api/playlists/p1/archive');
    expect(calls[0].options).toMatchObject({ method: 'POST' });
    expect(result.archivedAt).toBeDefined();
  });
});
