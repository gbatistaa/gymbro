import { Text, type TextProps } from 'react-native';

import { Colors, Type } from '@/constants/theme';

type LabelProps = TextProps & {
  /** Token de cor. Padrão `textMuted`, como a anotação de margem do brand. */
  color?: keyof typeof Colors.dark;
};

/**
 * Cabeçalho de seção, chip e anotação de margem: Plex Mono 12, caixa alta, tracking +0.08em.
 *
 * A cor vem de token, nunca de hex inline — e não usa opacidade: estado é troca de token.
 */
export function Label({ color = 'textMuted', style, ...rest }: LabelProps) {
  return <Text style={[Type.label, { color: Colors.dark[color] }, style]} {...rest} />;
}
