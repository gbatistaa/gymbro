import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { TextInput } from 'react-native';

import EditExerciseScreen from '@/app/exercises/[id]';
import NewExerciseScreen from '@/app/exercises/new';
import { exerciseCacheAtom } from '@/lib/exercise-cache';
import { getDefaultStore } from 'jotai';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({ id: 'e1' }),
}));

jest.mock('sonner-native', () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

jest.mock('@/lib/api', () => ({ getApiClient: () => ({}) }));

jest.mock('@/lib/api/exercises', () => ({
  createExercise: jest.fn(),
  updateExercise: jest.fn(),
  archiveExercise: jest.fn(),
}));

function render(element: React.ReactElement): ReactTestRenderer {
  let result!: ReactTestRenderer;
  act(() => {
    result = create(element);
  });
  return result;
}

function labels(element: ReactTestRenderer): string[] {
  return element.root
    .findAll((node) => node.props.accessibilityRole === 'button')
    .map((node) => String(node.props.accessibilityLabel));
}

function inputValues(element: ReactTestRenderer): string[] {
  return element.root.findAllByType(TextInput).map((node) => String(node.props.value ?? ''));
}

describe('NewExerciseScreen', () => {
  it('renders the five fields and a submit button', () => {
    const screen = render(<NewExerciseScreen />);

    // 5 campos do CreateExerciseDto
    expect(inputValues(screen)).toHaveLength(5);
    expect(labels(screen)).toContain('Salvar exercício');
  });
});

describe('EditExerciseScreen', () => {
  afterEach(() => {
    getDefaultStore().set(exerciseCacheAtom, {});
  });

  it('prefills the form from the cached exercise', () => {
    getDefaultStore().set(exerciseCacheAtom, {
      e1: { id: 'e1', name: 'Supino reto', primaryMuscle: 'CHEST', incrementKg: 2.5 },
    });

    const screen = render(<EditExerciseScreen />);

    expect(inputValues(screen)).toContain('Supino reto');
    expect(inputValues(screen)).toContain('CHEST');
    expect(inputValues(screen)).toContain('2,5');
    expect(labels(screen)).toContain('Salvar alterações');
  });

  it('offers the destructive archive action on edit', () => {
    getDefaultStore().set(exerciseCacheAtom, {
      e1: { id: 'e1', name: 'Supino reto', primaryMuscle: 'CHEST' },
    });

    const screen = render(<EditExerciseScreen />);

    expect(labels(screen)).toContain('Arquivar exercício');
  });

  it('explains the missing exercise instead of rendering an empty form', () => {
    const screen = render(<EditExerciseScreen />);

    expect(inputValues(screen)).toHaveLength(0);
    expect(labels(screen)).toContain('Voltar');
  });
});
