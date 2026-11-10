import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, View } from 'react-native';
import { toast } from 'sonner-native';

import { Button } from '@/components/ui/button';
import { DataRow } from '@/components/ui/data-row';
import { Label } from '@/components/ui/label';
import { LoadingBars } from '@/components/ui/loading-bars';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';
import { getApiClient } from '@/lib/api';
import {
  archivePlaylist,
  clonePlaylist,
  listPlaylists,
  type Playlist,
} from '@/lib/api/playlists';
import { messageForError, toApiError } from '@/lib/api/error-messages';

type Status = 'loading' | 'ready' | 'error';

/**
 * Índice de rotinas: o que você treina. Toque abre a rotina; toque longo abre clonar/arquivar.
 *
 * As ações ficam no toque longo porque a linha é uma régua de dado, não uma barra de ferramentas —
 * dois ícones por linha transformariam a lista em painel e quebrariam a densidade do caderno.
 */
export default function PlaylistsScreen() {
  const client = useMemo(() => getApiClient(), []);
  const [status, setStatus] = useState<Status>('loading');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setPlaylists(await listPlaylists(client, {}));
      setStatus('ready');
    } catch (cause) {
      toast.error(messageForError(toApiError(cause)));
      setStatus('error');
    }
  }, [client]);

  // recarrega ao voltar da criação/edição: sem isto uma rotina nova só apareceria no próximo boot
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const create = useCallback(() => {
    router.push('/playlists/new');
  }, []);

  const runAction = useCallback(
    async (action: 'clone' | 'archive', playlist: Playlist) => {
      setBusyId(playlist.id);
      try {
        if (action === 'clone') {
          await clonePlaylist(client, playlist.id);
          toast.success('Rotina clonada.');
        } else {
          await archivePlaylist(client, playlist.id);
        }
        await load();
      } catch (cause) {
        toast.error(messageForError(toApiError(cause)));
      } finally {
        setBusyId(null);
      }
    },
    [client, load],
  );

  const openActions = useCallback(
    (playlist: Playlist) => {
      Alert.alert(playlist.name, 'O que você quer fazer com esta rotina?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Clonar', onPress: () => void runAction('clone', playlist) },
        {
          text: 'Arquivar',
          style: 'destructive',
          onPress: () => void runAction('archive', playlist),
        },
      ]);
    },
    [runAction],
  );

  return (
    <Screen edges={['top']} className="gap-4">
      <Text type="title1">Rotinas</Text>

      {/* ação primária sempre visível: no empty state ela é a única coisa a fazer */}
      <Button label="Nova rotina" onPress={create} />

      {status === 'loading' && playlists.length === 0 ? (
        <View className="items-center py-10">
          <LoadingBars height={16} />
        </View>
      ) : status === 'error' && playlists.length === 0 ? (
        <View className="items-center gap-4 py-10">
          <Text type="caption" color="muted">
            Não foi possível carregar as rotinas.
          </Text>
          <Button label="Tentar de novo" onPress={() => void load()} />
        </View>
      ) : playlists.length === 0 ? (
        <View className="items-center py-10">
          <Text type="caption" color="muted">
            Você ainda não tem rotinas.
          </Text>
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={<SectionHeader title="Suas rotinas" />}
          renderItem={({ item }) => (
            <DataRow
              note={item.archivedAt === undefined ? undefined : 'arquivada'}
              onPress={() => router.push(`/playlists/${item.id}`)}
              onLongPress={() => openActions(item)}
              className={busyId === item.id ? 'opacity-60' : undefined}>
              <View>
                <Text type="body">{item.name}</Text>
                {item.description === undefined ? null : (
                  <Label numberOfLines={1}>{item.description}</Label>
                )}
              </View>
            </DataRow>
          )}
        />
      )}
    </Screen>
  );
}
