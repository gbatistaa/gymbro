import { Label } from '@/components/ui/label';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';

/** Placeholder da casca: existe para a navegação ser verificável antes da fase correspondente. */
export default function ProgressScreen() {
  return (
    <Screen edges={['top']} className="gap-2">
      <Text type="title1">Progresso</Text>
      <Label>Em construção</Label>
      <Text type="caption" color="muted" className="max-w-[320px]">
        Dashboard, histórico e estatísticas chegam na Fase 4.
      </Text>
    </Screen>
  );
}
