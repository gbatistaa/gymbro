import type { ExerciseInput } from '@/lib/api/exercises';

/** Valores como o formulário guarda: tudo string, inclusive o incremento. */
export type ExerciseFormValues = {
  name: string;
  primaryMuscle: string;
  secondaryMuscle: string;
  equipment: string;
  incrementKg: string;
};

const NAME_MIN = 3;
const NAME_MAX = 225;
const SECONDARY_MAX = 100;
const EQUIPMENT_MAX = 50;

/**
 * Espelha as constraints do `CreateExerciseDto` do backend.
 *
 * A validação local existe para o usuário não esperar um round-trip por "nome vazio"; a do
 * servidor continua sendo a autoridade e o erro dela vai para o toast.
 */
export function validateExercise(values: ExerciseFormValues): string | null {
  const name = values.name.trim();
  if (name.length === 0) {
    return 'Informe o nome do exercício.';
  }
  if (name.length < NAME_MIN) {
    return `O nome precisa de pelo menos ${NAME_MIN} caracteres.`;
  }
  if (name.length > NAME_MAX) {
    return `O nome tem no máximo ${NAME_MAX} caracteres.`;
  }

  if (values.primaryMuscle.trim().length === 0) {
    return 'Informe o músculo principal.';
  }
  if (values.secondaryMuscle.trim().length > SECONDARY_MAX) {
    return `O músculo secundário tem no máximo ${SECONDARY_MAX} caracteres.`;
  }
  if (values.equipment.trim().length > EQUIPMENT_MAX) {
    return `O equipamento tem no máximo ${EQUIPMENT_MAX} caracteres.`;
  }

  const increment = values.incrementKg.trim();
  if (increment.length > 0) {
    const parsed = parseKg(increment);
    if (parsed === null) {
      return 'O incremento precisa ser um número.';
    }
    if (parsed < 0) {
      return 'O incremento não pode ser negativo.';
    }
  }

  return null;
}

/** Converte o formulário para o corpo da API: trima texto, descarta vazio, vírgula vira ponto. */
export function toExerciseInput(values: ExerciseFormValues): ExerciseInput {
  const increment = values.incrementKg.trim();

  return {
    name: values.name.trim(),
    primaryMuscle: values.primaryMuscle.trim(),
    secondaryMuscle: optional(values.secondaryMuscle),
    equipment: optional(values.equipment),
    incrementKg: increment.length === 0 ? undefined : (parseKg(increment) ?? undefined),
  };
}

/** Preenche o formulário a partir de um exercício existente (edição). */
export function toFormValues(exercise: {
  name: string;
  primaryMuscle: string;
  secondaryMuscle?: string;
  equipment?: string;
  incrementKg?: number;
}): ExerciseFormValues {
  return {
    name: exercise.name,
    primaryMuscle: exercise.primaryMuscle,
    secondaryMuscle: exercise.secondaryMuscle ?? '',
    equipment: exercise.equipment ?? '',
    incrementKg: exercise.incrementKg === undefined ? '' : String(exercise.incrementKg).replace('.', ','),
  };
}

function optional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

/** Aceita `2,5` e `2.5`; devolve `null` quando não é número. */
function parseKg(value: string): number | null {
  const normalized = value.replace(',', '.').trim();
  if (!/^-?\d*\.?\d+$/.test(normalized)) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
