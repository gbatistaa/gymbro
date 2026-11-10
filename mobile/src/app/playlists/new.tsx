import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { toast } from 'sonner-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { getApiClient } from '@/lib/api';
import { createPlaylist } from '@/lib/api/playlists';
import { messageForError, toApiError } from '@/lib/api/error-messages';

export default function NewPlaylistScreen() {
  const client = useMemo(() => getApiClient(), []);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = useCallback(async () => {
    if (submitting) {
      return;
    }
    if (name.trim().length === 0) {
      toast.error('Informe o nome da rotina.');
      return;
    }

    setSubmitting(true);
    try {
      await createPlaylist(client, {
        name: name.trim(),
        description: description.trim().length === 0 ? undefined : description.trim(),
      });
      router.back();
    } catch (cause) {
      toast.error(messageForError(toApiError(cause)));
    } finally {
      setSubmitting(false);
    }
  }, [client, description, name, submitting]);

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerClassName="grow gap-6 py-6" keyboardShouldPersistTaps="handled">
        <Text type="title2">Nova rotina</Text>

        <TextField
          label="Nome"
          value={name}
          onChangeText={setName}
          placeholder="Push, Pull, Legs…"
          autoCapitalize="sentences"
          editable={!submitting}
        />

        <TextField
          label="Descrição"
          value={description}
          onChangeText={setDescription}
          placeholder="Opcional"
          autoCapitalize="sentences"
          editable={!submitting}
        />

        <Button label="Criar rotina" onPress={submit} loading={submitting} />
      </ScrollView>
    </Screen>
  );
}
