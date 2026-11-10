import type { ApiClient } from './client';

export type Playlist = {
  id: string;
  name: string;
  description?: string;
  /** Preenchido = arquivada: sai da lista, mas o histórico de treinos continua. */
  archivedAt?: string;
};

export type PlaylistExercise = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  orderIndex: number;
  targetSets: number;
  targetRepsMin?: number;
  targetRepsMax?: number;
  restSeconds?: number;
  note?: string;
};

export type PlaylistDetail = Playlist & {
  exercises: PlaylistExercise[];
};

export type PlaylistInput = {
  name: string;
  description?: string;
};

/** A lista não é paginada no backend: `GET /api/playlists` devolve o array inteiro. */
export async function listPlaylists(
  client: ApiClient,
  options: { includeArchived?: boolean } = {},
): Promise<Playlist[]> {
  const playlists = await client.request<Playlist[] | undefined>('/api/playlists', {
    query: { includeArchived: options.includeArchived },
  });
  return playlists ?? [];
}

export async function createPlaylist(client: ApiClient, input: PlaylistInput): Promise<Playlist> {
  return client.request<Playlist>('/api/playlists', { method: 'POST', body: input });
}

export async function clonePlaylist(client: ApiClient, id: string): Promise<Playlist> {
  return client.request<Playlist>(`/api/playlists/${id}/clone`, { method: 'POST' });
}

/**
 * Arquivar é `POST`, não `DELETE`: o backend faz soft delete para não quebrar o histórico.
 */
export async function archivePlaylist(client: ApiClient, id: string): Promise<Playlist> {
  return client.request<Playlist>(`/api/playlists/${id}/archive`, { method: 'POST' });
}

export async function getPlaylist(client: ApiClient, id: string): Promise<PlaylistDetail> {
  const detail = await client.request<Partial<PlaylistDetail>>(`/api/playlists/${id}`);
  return {
    id: detail.id ?? id,
    name: detail.name ?? '',
    description: detail.description,
    archivedAt: detail.archivedAt,
    exercises: detail.exercises ?? [],
  };
}
