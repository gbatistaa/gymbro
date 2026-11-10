import { router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';

/**
 * Aba Treinar: por enquanto só a porta para as rotinas.
 *
 * A sessão ao vivo (Task 19) toma o lugar deste conteúdo — a lista de rotinas continua sendo a
 * entrada, porque sem rotina não há treino para iniciar.
 */
export default function TrainScreen() {
  return (
    <Screen edges={['top']} className="gap-4">
      <Text type="title1">Treinar</Text>
      <Label>Rotinas</Label>
      <Text type="caption" color="muted">
        Escolha uma rotina para começar. A sessão ao vivo chega na Fase 3.
      </Text>
      <Button label="Ver rotinas" onPress={() => router.push('/playlists')} />
      <Button label="Catálogo de exercícios" variant="link" onPress={() => router.push('/exercises')} />
    </Screen>
  );
}
