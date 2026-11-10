import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

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
 */
export function TextField({
  label,
  error = false,
  disabled = false,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="gap-2">
      <Label>{label}</Label>

      <TextInput
        {...rest}
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
          disabled ? 'text-muted' : 'text-primary',
          error ? 'border-danger' : focused ? 'border-borderStrong' : 'border-transparent',
        )}
      />
    </View>
  );
}
