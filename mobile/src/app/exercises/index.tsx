import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { toast } from 'sonner-native';

import { Button } from '@/components/ui/button';
import { DataRow } from '@/components/ui/data-row';
import { Label } from '@/components/ui/label';
import { LoadingBars } from '@/components/ui/loading-bars';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { getApiClient } from '@/lib/api';
import { listExercises, type Exercise } from '@/lib/api/exercises';
import { messageForError, toApiError } from '@/lib/api/error-messages';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { useExerciseList } from '@/lib/use-exercise-list';

/**
 * Índice do caderno: nome, músculo e anotação na margem. Nada além do necessário para achar o
 * exercício e entrar no treino.
 */
export default function ExercisesScreen() {
  const client = useMemo(() => getApiClient(), []);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 400);

  // useCallback é obrigatório: sem identidade estável o efeito do hook refaz o fetch a cada
  // render, o setState re-renderiza, e a tela entra em loop de requests
  const fetchPage = useCallback(
    (page: number, q: string) =>
      listExercises(client, { q: q === '' ? undefined : q, page, size: 20 }),
    [client],
  );
  const list = useExerciseList(fetchPage, debouncedQuery);

  function onEndReached() {
    void list.loadMore().catch((cause: unknown) => {
      toast.error(messageForError(toApiError(cause)));
    });
  }

  return (
    <Screen edges={['top']}>
      <TextField
        label="Buscar exercício"
        value={query}
        onChangeText={setQuery}
        placeholder="Supino, remada, agachamento…"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      {list.status === 'loading' && list.items.length === 0 ? (
        <View className="items-center py-10">
          <LoadingBars height={16} />
        </View>
      ) : list.status === 'error' && list.items.length === 0 ? (
        <View className="items-center gap-4 py-10">
          <Text type="caption" color="muted">
            Não foi possível carregar os exercícios.
          </Text>
          <Button label="Tentar de novo" onPress={list.retry} />
        </View>
      ) : list.items.length === 0 ? (
        <View className="items-center gap-4 py-10">
          <Text type="caption" color="muted">
            Nenhum exercício encontrado.
          </Text>
          <Button label="Criar exercício" onPress={() => router.push('/exercises/new')} />
        </View>
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={(item) => item.id}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={<SectionHeader title="Exercícios" />}
          renderItem={({ item }: { item: Exercise }) => (
            <DataRow
              note={item.equipment ?? undefined}
              value={item.incrementKg === undefined ? undefined : formatKg(item.incrementKg)}
              unit={item.incrementKg === undefined ? undefined : 'kg'}
              onPress={() => router.push(`/exercises/${item.id}`)}>
              <View>
                <Text type="body">{item.name}</Text>
                <Label>{item.primaryMuscle}</Label>
              </View>
            </DataRow>
          )}
          ListFooterComponent={
            list.hasMore ? (
              <View className="items-center py-4">
                <LoadingBars height={12} />
              </View>
            ) : undefined
          }
        />
      )}
    </Screen>
  );
}

function formatKg(value: number): string {
  return value.toFixed(1).replace('.', ',');
}
