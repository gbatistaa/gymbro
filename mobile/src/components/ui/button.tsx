import { Pressable, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { cx } from '@/lib/cx';

import { LoadingBars } from './loading-bars';
import { Text, type TextColorToken } from './text';

type ButtonVariant = 'primary' | 'destructive' | 'link';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
};

const BASE_CLASS =
  'h-12 items-center justify-center self-stretch rounded-control px-6';

/** Fundo estático por variante: só entra aqui o que não muda com o toque. */
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  // âmbar escuro como padrão: chama menos atenção que o claro e o texto onAccent lê bem nele
  primary: 'bg-accentPressed',
  destructive: 'bg-transparent',
  link: 'bg-transparent',
};

const DISABLED_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-raised',
  destructive: 'bg-transparent',
  link: 'bg-transparent',
};

/** Cor do rótulo por **prop**: classe de cor no `Text` duplicaria a regra e vencia a errada. */
const TEXT_COLOR: Record<ButtonVariant, TextColorToken> = {
  primary: 'onAccent',
  destructive: 'danger',
  link: 'accent',
};

const PRESSED_COLOR: Record<ButtonVariant, string | undefined> = {
  primary: Colors.dark.accent,
  destructive: Colors.dark.raised,
  link: Colors.dark.accentTint,
};

/**
 * Ação do sistema: 48 de altura, raio 6, largura total.
 *
 * Layout e fundo em `className` (NativeWind, estático). O que depende do toque fica em `style`:
 * classe dinâmica no `className` faz o interop remontar o estilo a cada pressão e quebra o render
 * no nativo.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: ButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      android_ripple={{
        color:
          variant === 'link' || variant === 'destructive'
            ? Colors.dark.accentTint
            : Colors.dark.raised,
      }}
      className={cx(BASE_CLASS, disabled ? DISABLED_CLASS[variant] : VARIANT_CLASS[variant])}
      style={({ pressed }) => ({
        backgroundColor: pressed && !inactive ? PRESSED_COLOR[variant] : undefined,
        // o botão "afunda" 2% ao pressionar, além da troca de cor
        transform: [{ scale: pressed && !inactive ? 0.98 : 1 }],
      })}>
      {loading ? (
        <LoadingBars height={Spacing.three} color={disabled ? Colors.dark.textMuted : Colors.dark.onAccent} />
      ) : (
        <View className="flex-row items-center gap-2">
          <Text type="bodyStrong" color={disabled ? 'muted' : TEXT_COLOR[variant]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
