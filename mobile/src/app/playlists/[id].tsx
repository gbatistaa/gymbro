import { router, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';

/** Placeholder da Task 17: detalhe da rotina com os exercícios ordenados. */
export default function PlaylistDetailPlaceholder() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen edges={['top']} className="justify-center gap-4">
      <Text type="title2">Rotina</Text>
      <Text type="caption" color="muted">
        Os exercícios desta rotina chegam na Task 17. Id: {id}
      </Text>
      <Button label="Voltar" variant="link" onPress={() => router.back()} />
    </Screen>
  );
}
