import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cx } from '@/lib/cx';

/**
 * Token → classes do Tailwind. Uma verdade só: a escala tipográfica vive em
 * `tailwind.config.js`; este mapa apenas dá nome a cada combinação.
 */
const TYPE_CLASS = {
  label: 'text-label font-monoMedium uppercase tracking-label',
  caption: 'text-caption font-sans',
  body: 'text-body font-sans',
  bodyStrong: 'text-body font-sansSemiBold',
  title3: 'text-title3 font-sansSemiBold',
  title2: 'text-title2 font-sansSemiBold',
  title1: 'text-title1 font-sansSemiBold',
  display: 'text-display font-sansSemiBold',
  numeral: 'text-numeral font-monoMedium tracking-numeral',
  numeralXL: 'text-numeralXL font-monoMedium tracking-numeralXL',
} as const;

export type TextToken = keyof typeof TYPE_CLASS;

export type TextColorToken =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'accent'
  | 'accentPressed'
  | 'danger'
  | 'onAccent';

const COLOR_CLASS: Record<TextColorToken, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  muted: 'text-muted',
  accent: 'text-accent',
  accentPressed: 'text-accentPressed',
  danger: 'text-danger',
  onAccent: 'text-onAccent',
};

type TextProps = RNTextProps & {
  type?: TextToken;
  color?: TextColorToken;
};

/** Texto do sistema: só aceita token de escala e de cor — nunca `fontSize` ou hex inline. */
export function Text({ type = 'body', color = 'primary', className, ...rest }: TextProps) {
  return <RNText className={cx(TYPE_CLASS[type], COLOR_CLASS[color], className)} {...rest} />;
}
