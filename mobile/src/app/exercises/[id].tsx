import { Text } from '@/components/ui/text';
import { Screen } from '@/components/ui/screen';

/**
 * Placeholder da Task 15: detalhe e edição do exercício.
 *
 * Existe para as rotas tipadas compilarem; a Task 14 navega para cá.
 */
export default function ExerciseDetailPlaceholder() {
  return (
    <Screen edges={['top']}>
      <Text type="title2">Exercício</Text>
      <Text type="caption" color="muted">
        Detalhe e edição chegam na Task 15.
      </Text>
    </Screen>
  );
}
