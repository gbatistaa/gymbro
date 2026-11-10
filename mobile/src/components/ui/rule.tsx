import { Platform, StyleSheet, View } from 'react-native';

import { cx } from '@/lib/cx';

/**
 * A régua do caderno de treino: 1 pixel físico em toda plataforma.
 *
 * A espessura é o único valor que não vem do Tailwind: `hairlineWidth` no iOS é 1 pixel físico
 * (0,33pt num @3x) e não existe classe para isso. A cor vem de `bg-rule`.
 */
const HAIRLINE = Platform.select({ ios: StyleSheet.hairlineWidth, default: 1 });

/** Separa linhas de dado. A cor é fixa: régua de outra cor não é régua. */
export function Rule({ className }: { className?: string }) {
  return <View style={{ height: HAIRLINE }} className={cx('bg-rule', className)} />;
}
