import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { toast } from 'sonner-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { getAuthApi } from '@/lib/api';
import { messageForError, toApiError } from '@/lib/api/error-messages';
import { setSession } from '@/lib/auth/session';
import { refreshTokenStorage } from '@/lib/auth/storage';

/**
 * Validação no toque: o botão de submit está sempre visível e sempre âmbar.
 *
 * Devolve a primeira coisa que falta, em vez de acumular erros por campo — o aviso é um toast no
 * topo, não um bloco condicional dentro do formulário.
 */
function validate(email: string, password: string): string | null {
  if (email.trim().length === 0) {
    return 'Informe o e-mail.';
  }
  if (password.length === 0) {
    return 'Informe a senha.';
  }
  return null;
}

export default function LoginScreen() {
  const { email: prefilledEmail } = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(prefilledEmail ?? '');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (submitting) {
      return;
    }

    const invalid = validate(email, password);
    if (invalid !== null) {
      toast.error(invalid);
      return;
    }

    setSubmitting(true);
    try {
      const auth = getAuthApi();
      const tokens = await auth.login({ email: email.trim(), password });
      // perfil é buscado com o token recém-recebido: a sessão ainda não existe no estado
      const profile = await auth.currentUser(tokens.accessToken);
      await refreshTokenStorage.save(tokens.refreshToken);
      setSession({
        accessToken: tokens.accessToken,
        expiresAt: Date.now() + tokens.expiresIn * 1000,
        profile,
      });
      router.replace('/');
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
            <Text type="title1" className="uppercase tracking-wordmark">
              Gymbro
            </Text>
            <Text type="caption" color="muted">
              Entre para registrar o treino de hoje.
            </Text>
          </View>

          <View className="gap-5">
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
              placeholder="••••••••"
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              autoCapitalize="none"
              returnKeyType="go"
              onSubmitEditing={submit}
              editable={!submitting}
            />
          </View>

          <View className="gap-5">
            <Button label="Entrar" onPress={submit} loading={submitting} />

            <Button
              label="Criar conta"
              variant="link"
              onPress={() => router.push('/register')}
              disabled={submitting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
