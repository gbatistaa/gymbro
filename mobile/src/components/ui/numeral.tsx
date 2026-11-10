import { Text } from './text';

type NumeralProps = {
  /** Valor já formatado em pt-BR (`42,5`). Formatação é de quem chama. */
  value: string;
  /** `numeralXL` (88) é o único destaque da tela; no máximo um por tela. */
  size?: 'numeral' | 'numeralXL';
  color?: 'primary' | 'secondary' | 'muted' | 'accent';
  className?: string;
};

/**
 * O número que a tela está mostrando agora.
 *
 * Recebe `value: string` em vez de `children`: impede ícone, emoji ou texto solto dentro do
 * elemento que existe só para o dado.
 */
export function Numeral({ value, size = 'numeral', color = 'primary', className }: NumeralProps) {
  return (
    <Text type={size} color={color} className={className}>
      {value}
    </Text>
  );
}
