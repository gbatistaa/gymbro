import { Label } from '@/components/ui/label';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';

/** Placeholder da casca: existe para a navegação ser verificável antes da fase correspondente. */
export default function ProfileScreen() {
  return (
    <Screen edges={['top']} className="gap-2">
      <Text type="title1">Perfil</Text>
      <Label>Em construção</Label>
      <Text type="caption" color="muted" className="max-w-[320px]">
        Nome, e-mail, fuso e bioimpedância chegam na Fase 5.
      </Text>
    </Screen>
  );
}
