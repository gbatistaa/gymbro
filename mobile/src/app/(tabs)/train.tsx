import { Label } from '@/components/ui/label';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';

/** Placeholder da casca: existe para a navegação ser verificável antes da fase correspondente. */
export default function TrainScreen() {
  return (
    <Screen edges={['top']} className="gap-2">
      <Text type="title1">Treinar</Text>
      <Label>Em construção</Label>
      <Text type="caption" color="muted" className="max-w-[320px]">
        Iniciar e retomar sessão chegam na Fase 3.
      </Text>
    </Screen>
  );
}
