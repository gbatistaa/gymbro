import { View, type ViewProps } from 'react-native';

import { Spacing } from '@/constants/theme';

import { Label } from './label';
import { Rule } from './rule';

type SectionHeaderProps = ViewProps & {
  /** Texto do cabeçalho; em mono, caixa alta (o `Type.label` aplica o `textTransform`). */
  title: string;
};

/**
 * `SEMANA 45` seguido de régua até a borda.
 *
 * Só aceita texto de propósito: a regra do brand é "sem ícone decorativo ao lado", e a forma mais
 * barata de garantir isso é não abrir espaço no componente para passar um.
 */
export function SectionHeader({ title, style, className, ...rest }: SectionHeaderProps) {
  return (
    <View
      style={[{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }, style]}
      className={className}
      {...rest}>
      <Label>{title}</Label>
      <Rule className="flex-1" />
    </View>
  );
}
