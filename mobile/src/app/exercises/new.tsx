import { Text } from '@/components/ui/text';
import { Screen } from '@/components/ui/screen';

/**
 * Placeholder da Task 15: criação de exercício.
 *
 * Existe para as rotas tipadas compilarem; a Task 14 navega para cá no empty state.
 */
export default function NewExercisePlaceholder() {
  return (
    <Screen edges={['top']}>
      <Text type="title2">Novo exercício</Text>
      <Text type="caption" color="muted">
        Criação de exercício chega na Task 15.
      </Text>
    </Screen>
  );
}
