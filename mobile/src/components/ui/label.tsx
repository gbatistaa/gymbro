import { Text } from './text';

type LabelProps = {
  children: string;
  /** `muted` por padrão: anotação de margem do brand. */
  color?: 'muted' | 'secondary' | 'primary' | 'accent' | 'danger';
  className?: string;
  numberOfLines?: number;
};

/** Cabeçalho de seção, chip e anotação de margem: Mono 12, caixa alta, tracking +0.08em. */
export function Label({ children, color = 'muted', className, numberOfLines }: LabelProps) {
  return (
    <Text type="label" color={color} className={className} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}
