import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { Label } from './label';
import { Rule } from './rule';
import { Text } from './text';

const ROW = 'flex-row items-center py-4';

type DataRowProps = {
  /** Conteúdo principal: nome do exercício, data, rótulo. */
  children: ReactNode;
  /** Valor já formatado (`42,5`), em Mono e alinhado à direita. */
  value?: string;
  /** Unidade ao lado do valor (`kg`, `%`). */
  unit?: string;
  /** Anotação de margem (`+2,5 kg`, `RPE 8`, `há 6 d`). */
  note?: string;
  onPress?: () => void;
  /** Ações secundárias (clonar, arquivar): abre menu nativo em vez de encher a linha de ícones. */
  onLongPress?: () => void;
  disabled?: boolean;
  className?: string;
};

/**
 * A linha do caderno: anotação na gutter, conteúdo, número à direita, régua embaixo.
 *
 * Card com sombra não é o padrão de lista. `pressed` troca o fundo para `raised` e mantém a régua;
 * nunca usa fade de opacidade.
 */
export function DataRow({
  children,
  value,
  unit,
  note,
  onPress,
  onLongPress,
  disabled = false,
  className,
}: DataRowProps) {
  const content = (
    <>
      {/* gutter sempre reservada, mesmo vazia, para as linhas alinharem */}
      <View className="w-16">
        {note === undefined ? null : (
          <Label numberOfLines={1}>
            {note}
          </Label>
        )}
      </View>

      <View className="flex-1 justify-center">{children}</View>

      {value === undefined ? null : (
        <View className="flex-row items-baseline gap-1">
          <Text
            type="body"
            color={disabled ? 'muted' : 'primary'}
            className="font-mono text-right">
            {value}
          </Text>
          {unit === undefined ? null : (
            <Text type="body" color="secondary">
              {unit}
            </Text>
          )}
        </View>
      )}
    </>
  );

  return (
    <View className={className}>
      {onPress === undefined ? (
        <View className={ROW}>{content}</View>
      ) : (
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          disabled={disabled && onLongPress === undefined}
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          android_ripple={{ color: Colors.dark.raised }}
          // fundo dinâmico em `style`: classe condicional quebra o interop no nativo (ver Button)
          className={ROW}
          style={({ pressed }) => ({
            backgroundColor: pressed && !disabled ? Colors.dark.raised : 'transparent',
          })}>
          {content}
        </Pressable>
      )}
      <Rule />
    </View>
  );
}
