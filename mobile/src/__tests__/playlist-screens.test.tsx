import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { TextInput } from 'react-native';

import PlaylistsScreen from '@/app/playlists';
import NewPlaylistScreen from '@/app/playlists/new';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
  // `useFocusEffect` normalmente roda no foco da tela; no teste basta o efeito de mount
  useFocusEffect: (callback: () => void) => {
    React.useEffect(callback, [callback]);
  },
  useLocalSearchParams: () => ({ id: 'p1' }),
}));

jest.mock('sonner-native', () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

jest.mock('@/lib/api', () => ({ getApiClient: () => ({}) }));

const mockListPlaylists = jest.fn();
const mockArchivePlaylist = jest.fn();
const mockClonePlaylist = jest.fn();

jest.mock('@/lib/api/playlists', () => ({
  listPlaylists: (...args: unknown[]) => mockListPlaylists(...args),
  archivePlaylist: (...args: unknown[]) => mockArchivePlaylist(...args),
  clonePlaylist: (...args: unknown[]) => mockClonePlaylist(...args),
  createPlaylist: jest.fn(),
}));

async function render(element: React.ReactElement): Promise<ReactTestRenderer> {
  let result!: ReactTestRenderer;
  await act(async () => {
    result = create(element);
  });
  return result;
}

function textOf(element: ReactTestRenderer): string {
  const parts: string[] = [];
  for (const node of element.root.findAll(
    (n) => typeof n.type === 'string' && n.type.toLowerCase().includes('text'),
  )) {
    for (const child of node.children ?? []) {
      if (typeof child === 'string') {
        parts.push(child);
      }
    }
  }
  return parts.join(' | ');
}

function labels(element: ReactTestRenderer): string[] {
  return Array.from(
    new Set(
      element.root
        .findAll((node) => node.props.accessibilityRole === 'button')
        .map((node) => String(node.props.accessibilityLabel)),
    ),
  );
}

describe('PlaylistsScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockListPlaylists.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('lists the routines and always offers the create action', async () => {
    mockListPlaylists.mockResolvedValue([
      { id: 'p1', name: 'Push', description: 'Peito e ombro' },
      { id: 'p2', name: 'Pull' },
    ]);

    const screen = await render(<PlaylistsScreen />);

    expect(textOf(screen)).toContain('Push');
    expect(textOf(screen)).toContain('Pull');
    expect(textOf(screen)).toContain('Peito e ombro');
    expect(labels(screen)).toContain('Nova rotina');
  });

  it('marks archived routines in the margin', async () => {
    mockListPlaylists.mockResolvedValue([
      { id: 'p1', name: 'Antiga', archivedAt: '2026-01-01T00:00:00Z' },
    ]);

    const screen = await render(<PlaylistsScreen />);

    expect(textOf(screen)).toContain('arquivada');
  });

  it('shows the empty state when there is nothing to train', async () => {
    mockListPlaylists.mockResolvedValue([]);

    const screen = await render(<PlaylistsScreen />);

    expect(textOf(screen)).toContain('Você ainda não tem rotinas.');
  });

  it('shows the error state with retry when the load fails', async () => {
    mockListPlaylists.mockRejectedValue(new Error('boom'));

    const screen = await render(<PlaylistsScreen />);

    expect(textOf(screen)).toContain('Não foi possível carregar as rotinas.');
    expect(labels(screen)).toContain('Tentar de novo');
  });
});

describe('NewPlaylistScreen', () => {
  it('renders name, description and the create button', async () => {
    const screen = await render(<NewPlaylistScreen />);

    expect(screen.root.findAllByType(TextInput)).toHaveLength(2);
    expect(labels(screen)).toContain('Criar rotina');
  });
});
