import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import ExercisesScreen from '@/app/exercises';
import type { ExercisePage } from '@/lib/api/exercises';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
}));

jest.mock('sonner-native', () => ({
  toast: { error: jest.fn() },
}));

const mockListExercises = jest.fn();

jest.mock('@/lib/api/exercises', () => ({
  listExercises: (...args: unknown[]) => mockListExercises(...args),
}));

jest.mock('@/lib/api', () => ({
  getApiClient: () => ({}),
}));

function pageOf(ids: string[]): ExercisePage {
  return {
    content: ids.map((id) => ({ id, name: `Exercício ${id}`, primaryMuscle: 'CHEST' })),
    page: 0,
    size: 20,
    totalElements: ids.length,
    totalPages: 1,
  };
}

async function render(): Promise<ReactTestRenderer> {
  let result!: ReactTestRenderer;
  await act(async () => {
    result = create(<ExercisesScreen />);
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

describe('ExercisesScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockListExercises.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('lists the exercises from the first page', async () => {
    mockListExercises.mockResolvedValue(pageOf(['a', 'b']));

    const screen = await render();

    expect(textOf(screen)).toContain('Exercício a');
    expect(textOf(screen)).toContain('Exercício b');
    expect(textOf(screen)).toContain('Exercícios');
  });

  it('shows the empty state when the search returns nothing', async () => {
    mockListExercises.mockResolvedValue(pageOf([]));

    const screen = await render();

    expect(textOf(screen)).toContain('Nenhum exercício encontrado.');
    expect(textOf(screen)).toContain('Criar exercício');
  });

  it('shows the error state with retry when the load fails', async () => {
    mockListExercises.mockRejectedValue(new Error('boom'));

    const screen = await render();

    expect(textOf(screen)).toContain('Não foi possível carregar os exercícios.');
    expect(textOf(screen)).toContain('Tentar de novo');
  });
});
