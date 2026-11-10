import { Platform, StyleSheet, View } from 'react-native';

/**
 * A régua do caderno de treino: 1 pixel físico em toda plataforma.
 *
 * `hairlineWidth` no iOS resolve para a espessura de 1 pixel físico na densidade do aparelho
 * (0,33pt num @3x); no Android 1 é 1dp. Usar 1 fixo no iOS daria uma linha três vezes mais grossa
 * num aparelho @3x, e a régua é o elemento-assinatura — a espessura não pode variar.
 */
const HAIRLINE = Platform.select({ ios: StyleSheet.hairlineWidth, default: 1 });

/** Separa linhas de dado. A cor é fixa: uma régua de outra cor não é régua. */
export function Rule({ className }: { className?: string }) {
  return <View style={{ height: HAIRLINE }} className={`bg-rule ${className ?? ''}`} />;
}
