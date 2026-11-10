import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { toast } from 'sonner-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { getAuthApi } from '@/lib/api';
import { messageForError, toApiError } from '@/lib/api/error-messages';

function validate(name: string, email: string, password: string): string | null {
  if (name.trim().length === 0) {
    return 'Informe o nome.';
  }
  if (!email.includes('@')) {
    return 'Informe um e-mail válido.';
  }
  if (password.length < 8) {
    return 'A senha precisa de 8 caracteres.';
  }
  return null;
}

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (submitting) {
      return;
    }

    const invalid = validate(name, email, password);
    if (invalid !== null) {
      toast.error(invalid);
      return;
    }

    setSubmitting(true);
    try {
      await getAuthApi().register({ name: name.trim(), email: email.trim(), password });
      // registro não autentica (201 sem tokens): volta ao login com o e-mail preenchido
      router.replace({ pathname: '/login', params: { email: email.trim() } });
    } catch (cause) {
      toast.error(messageForError(toApiError(cause)));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* flex-1 é obrigatório: sem altura própria o ScrollView não é limitado pelo pai, o
            conteúdo que excede a tela fica cortado (sem rolagem) e os botões da base somem */}
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow justify-center gap-10 py-10"
          keyboardShouldPersistTaps="handled">
          <View className="gap-2">
            <Text type="title2">Criar conta</Text>
            <Text type="caption" color="muted">
              Um e-mail, uma senha e o histórico começa no primeiro treino.
            </Text>
          </View>

          <View className="gap-5">
            <TextField
              label="Nome"
              value={name}
              onChangeText={setName}
              placeholder="Como quer ser chamado"
              autoComplete="name"
              textContentType="name"
              autoCapitalize="words"
              returnKeyType="next"
              editable={!submitting}
            />

            <TextField
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="voce@exemplo.com"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              editable={!submitting}
            />

            <TextField
              label="Senha"
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo de 8 caracteres"
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              autoCapitalize="none"
              returnKeyType="go"
              onSubmitEditing={submit}
              editable={!submitting}
            />
          </View>

          <View className="gap-5">
            <Button label="Criar conta" onPress={submit} loading={submitting} />

            <Button
              label="Já tenho conta"
              variant="link"
              onPress={() => router.replace('/login')}
              disabled={submitting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
