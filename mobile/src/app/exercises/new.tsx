import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { toast } from 'sonner-native';

import { ExerciseForm } from '@/components/exercise-form';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { getApiClient } from '@/lib/api';
import { createExercise } from '@/lib/api/exercises';
import { messageForError, toApiError } from '@/lib/api/error-messages';
import { toExerciseInput, validateExercise, type ExerciseFormValues } from '@/lib/exercise-form';

const EMPTY: ExerciseFormValues = {
  name: '',
  primaryMuscle: '',
  secondaryMuscle: '',
  equipment: '',
  incrementKg: '',
};

export default function NewExerciseScreen() {
  const client = useMemo(() => getApiClient(), []);
  const [submitting, setSubmitting] = useState(false);

  const submit = useCallback(
    async (values: ExerciseFormValues) => {
      if (submitting) {
        return;
      }

      const invalid = validateExercise(values);
      if (invalid !== null) {
        toast.error(invalid);
        return;
      }

      setSubmitting(true);
      try {
        await createExercise(client, toExerciseInput(values));
        toast.success('Exercício criado.');
        router.back();
      } catch (cause) {
        toast.error(messageForError(toApiError(cause)));
      } finally {
        setSubmitting(false);
      }
    },
    [client, submitting],
  );

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerClassName="grow gap-6 py-6" keyboardShouldPersistTaps="handled">
        <Text type="title2">Novo exercício</Text>
        <ExerciseForm
          initial={EMPTY}
          submitLabel="Salvar exercício"
          submitting={submitting}
          onSubmit={submit}
        />
      </ScrollView>
    </Screen>
  );
}
