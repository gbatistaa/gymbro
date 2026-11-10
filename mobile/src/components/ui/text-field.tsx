import { useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

import { Colors } from '@/constants/theme';
import { cx } from '@/lib/cx';

import { Label } from './label';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Realça o campo em `danger`. Erros de formulário agora vão para o toast. */
  error?: boolean;
  disabled?: boolean;
};

/**
 * Campo de texto do sistema: rótulo Mono acima, input de 48, borda que existe sempre.
 *
 * A borda é `border-transparent` quando ociosa e não ausente, para o layout não pular 1px ao
 * focar. Cor do placeholder vem de `placeholderTextColor` porque é prop nativa, não estilo.
 *
 * Quando `secureTextEntry` vem ligado, o campo ganha o botão do olhinho (Feather, 48 de alvo):
 * ele só alterna a visibilidade local, nunca muda o valor. Campos normais não têm o botão.
 */
export function TextField({
  label,
  error = false,
  disabled = false,
  secureTextEntry,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const isPassword = secureTextEntry === true;

  return (
    <View className="gap-2">
      <Label>{label}</Label>

      <View>
        <TextInput
          {...rest}
          secureTextEntry={isPassword && !visible}
          editable={!disabled}
          placeholderTextColor={Colors.dark.textMuted}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          className={cx(
            'h-12 rounded-control border bg-raised px-4 text-body font-sans',
            isPassword && 'pr-12',
            disabled ? 'text-muted' : 'text-primary',
            error ? 'border-danger' : focused ? 'border-borderStrong' : 'border-transparent',
          )}
        />

        {isPassword ? (
          <Pressable
            onPress={() => setVisible((current) => !current)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
            accessibilityState={{ disabled }}
            className="absolute right-0 top-0 h-12 w-12 items-center justify-center">
            <Feather
              name={visible ? 'eye-off' : 'eye'}
              size={20}
              color={Colors.dark.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
