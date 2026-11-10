import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import type { ExerciseFormValues } from '@/lib/exercise-form';

type ExerciseFormProps = {
  initial: ExerciseFormValues;
  submitLabel: string;
  submitting: boolean;
  onSubmit(values: ExerciseFormValues): void;
  /** Só na edição: ação destrutiva separada do salvar. */
  onArchive?: () => void;
  archiveLabel?: string;
};

/**
 * Formulário de exercício, usado na criação e na edição.
 *
 * Os campos são os do `CreateExerciseDto`. Nenhuma cor ou espaçamento aqui: vem dos primitivos.
 * Erro de validação e de servidor não aparecem no corpo — vão para o toast no topo.
 */
export function ExerciseForm({
  initial,
  submitLabel,
  submitting,
  onSubmit,
  onArchive,
  archiveLabel = 'Arquivar exercício',
}: ExerciseFormProps) {
  const [values, setValues] = useState<ExerciseFormValues>(initial);

  function update(field: keyof ExerciseFormValues) {
    return (text: string) => setValues((current) => ({ ...current, [field]: text }));
  }

  return (
    <View className="gap-5">
      <TextField
        label="Nome"
        value={values.name}
        onChangeText={update('name')}
        placeholder="Supino reto"
        autoCapitalize="sentences"
        editable={!submitting}
      />

      <TextField
        label="Músculo principal"
        value={values.primaryMuscle}
        onChangeText={update('primaryMuscle')}
        placeholder="CHEST"
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!submitting}
      />

      <TextField
        label="Músculo secundário"
        value={values.secondaryMuscle}
        onChangeText={update('secondaryMuscle')}
        placeholder="Opcional"
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!submitting}
      />

      <TextField
        label="Equipamento"
        value={values.equipment}
        onChangeText={update('equipment')}
        placeholder="Barra, halteres, máquina…"
        autoCapitalize="sentences"
        editable={!submitting}
      />

      <TextField
        label="Incremento"
        value={values.incrementKg}
        onChangeText={update('incrementKg')}
        placeholder="2,5"
        keyboardType="decimal-pad"
        editable={!submitting}
      />

      <View className="gap-3">
        <Button
          label={submitLabel}
          onPress={() => onSubmit(values)}
          loading={submitting}
        />

        {onArchive === undefined ? null : (
          <Button
            label={archiveLabel}
            variant="destructive"
            onPress={onArchive}
            disabled={submitting}
          />
        )}
      </View>

      {onArchive === undefined ? null : (
        <Text type="caption" color="muted">
          Arquivar tira o exercício da lista, mas mantém o histórico de treinos.
        </Text>
      )}
    </View>
  );
}
