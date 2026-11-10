import { View, type ViewProps } from 'react-native';

import { cx } from '@/lib/cx';

import { Label } from './label';
import { Rule } from './rule';

type SectionHeaderProps = ViewProps & {
  /** Texto do cabeçalho; em mono, caixa alta (o token `label` aplica o `uppercase`). */
  title: string;
};

/**
 * `SEMANA 45` seguido de régua até a borda.
 *
 * Só aceita texto de propósito: a regra do brand é "sem ícone decorativo ao lado", e a forma mais
 * barata de garantir isso é não abrir espaço no componente para passar um.
 */
export function SectionHeader({ title, className, ...rest }: SectionHeaderProps) {
  return (
    <View className={cx('flex-row items-center gap-2', className)} {...rest}>
      <Label>{title}</Label>
      <Rule className="flex-1" />
    </View>
  );
}
