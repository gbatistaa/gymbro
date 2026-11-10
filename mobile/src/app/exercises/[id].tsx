import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { toast } from 'sonner-native';

import { ExerciseForm } from '@/components/exercise-form';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { getApiClient } from '@/lib/api';
import { archiveExercise, updateExercise } from '@/lib/api/exercises';
import { messageForError, toApiError } from '@/lib/api/error-messages';
import { findExercise } from '@/lib/exercise-cache';
import { toExerciseInput, toFormValues, validateExercise, type ExerciseFormValues } from '@/lib/exercise-form';

export default function EditExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const client = useMemo(() => getApiClient(), []);
  const exercise = useMemo(() => (id === undefined ? undefined : findExercise(id)), [id]);
  const [submitting, setSubmitting] = useState(false);

  const submit = useCallback(
    async (values: ExerciseFormValues) => {
      if (submitting || id === undefined) {
        return;
      }

      const invalid = validateExercise(values);
      if (invalid !== null) {
        toast.error(invalid);
        return;
      }

      setSubmitting(true);
      try {
        await updateExercise(client, id, toExerciseInput(values));
        router.back();
      } catch (cause) {
        toast.error(messageForError(toApiError(cause)));
      } finally {
        setSubmitting(false);
      }
    },
    [client, id, submitting],
  );

  const archive = useCallback(() => {
    if (id === undefined) {
      return;
    }

    // ação destrutiva sempre com confirmação explícita (brand §9)
    Alert.alert(
      'Arquivar exercício',
      'Ele sai da lista, mas o histórico de treinos continua.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Arquivar',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setSubmitting(true);
              try {
                await archiveExercise(client, id);
                router.back();
              } catch (cause) {
                toast.error(messageForError(toApiError(cause)));
              } finally {
                setSubmitting(false);
              }
            })();
          },
        },
      ],
    );
  }, [client, id]);

  if (exercise === undefined) {
    return (
      <Screen edges={['top']} className="justify-center gap-4">
        <Text type="title3">Exercício não encontrado</Text>
        <Text type="caption" color="muted">
          A API não expõe um exercício isolado. Abra pela lista de exercícios.
        </Text>
        <Button label="Voltar" variant="link" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerClassName="grow gap-6 py-6" keyboardShouldPersistTaps="handled">
        <Text type="title2">Editar exercício</Text>
        <ExerciseForm
          initial={toFormValues(exercise)}
          submitLabel="Salvar alterações"
          submitting={submitting}
          onSubmit={submit}
          onArchive={archive}
        />
      </ScrollView>
    </Screen>
  );
}
