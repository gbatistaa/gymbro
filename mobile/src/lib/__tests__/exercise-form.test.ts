import { toExerciseInput, validateExercise, type ExerciseFormValues } from '../exercise-form';

const VALID: ExerciseFormValues = {
  name: 'Supino reto',
  primaryMuscle: 'CHEST',
  secondaryMuscle: '',
  equipment: '',
  incrementKg: '2,5',
};

describe('validateExercise', () => {
  it('accepts a complete form', () => {
    expect(validateExercise(VALID)).toBeNull();
  });

  it('requires a name of at least three characters', () => {
    expect(validateExercise({ ...VALID, name: '  ' })).toBe('Informe o nome do exercício.');
    expect(validateExercise({ ...VALID, name: 'ab' })).toBe(
      'O nome precisa de pelo menos 3 caracteres.',
    );
  });

  it('requires the primary muscle', () => {
    expect(validateExercise({ ...VALID, primaryMuscle: ' ' })).toBe(
      'Informe o músculo principal.',
    );
  });

  it('rejects an increment that is not a number', () => {
    expect(validateExercise({ ...VALID, incrementKg: 'abc' })).toBe(
      'O incremento precisa ser um número.',
    );
  });

  it('rejects a negative increment', () => {
    expect(validateExercise({ ...VALID, incrementKg: '-1' })).toBe(
      'O incremento não pode ser negativo.',
    );
  });

  it('accepts an empty increment', () => {
    expect(validateExercise({ ...VALID, incrementKg: '' })).toBeNull();
  });

  it('respects the backend size limits', () => {
    expect(validateExercise({ ...VALID, equipment: 'x'.repeat(51) })).toBe(
      'O equipamento tem no máximo 50 caracteres.',
    );
    expect(validateExercise({ ...VALID, name: 'x'.repeat(226) })).toBe(
      'O nome tem no máximo 225 caracteres.',
    );
  });
});

describe('toExerciseInput', () => {
  it('trims text, drops empty optionals and parses the comma decimal', () => {
    const input = toExerciseInput({
      name: '  Supino reto  ',
      primaryMuscle: ' CHEST ',
      secondaryMuscle: '  ',
      equipment: '',
      incrementKg: '2,5',
    });

    expect(input).toEqual({
      name: 'Supino reto',
      primaryMuscle: 'CHEST',
      secondaryMuscle: undefined,
      equipment: undefined,
      incrementKg: 2.5,
    });
  });

  it('accepts a dot decimal too', () => {
    expect(toExerciseInput({ ...VALID, incrementKg: '2.5' }).incrementKg).toBe(2.5);
  });

  it('omits the increment when the field is empty', () => {
    expect(toExerciseInput({ ...VALID, incrementKg: '' }).incrementKg).toBeUndefined();
  });
});
