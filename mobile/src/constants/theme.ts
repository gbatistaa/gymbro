/**
 * Tokens do Gymbro.
 *
 * `docs/brand-identity.md` §10 é a fonte de verdade: nenhum valor aqui pode ser inventado, e
 * nenhuma tela deve escrever cor, tamanho ou espaçamento que não venha deste arquivo.
 *
 * Escala de 4 no NativeWind: a escala numérica do Tailwind já coincide com a do brand
 * (1=4, 2=8, 3=12, 4=16, 5=20, 6=24, 8=32, 10=40, 12=48, 16=64), então não sobrescrevemos
 * `spacing` — duas verdades sobre o mesmo número é como o layout diverge.
 */

import '@/global.css';

import { Platform } from 'react-native';

/** Paleta escura do MVP. É a única paleta ativa: tema claro é pós-MVP e terá paleta própria. */
export const Colors = {
  dark: {
    canvas: '#121110',
    surface: '#1A1917',
    raised: '#232120',
    border: '#2E2B28',
    rule: '#3A3632',
    borderStrong: '#787067',
    textMuted: '#9A9188',
    textSecondary: '#B8B0A6',
    textPrimary: '#F2EEE8',
    accent: '#F5B23D',
    accentPressed: '#D9931A',
    accentTint: '#2B2218',
    danger: '#F2665C',
    onAccent: '#121110',
  },
} as const;

/**
 * Duas famílias, nunca três. Plex Mono garante a tabularidade dos números.
 *
 * Os nomes levam o prefixo `IBM` porque são os que `@expo-google-fonts/ibm-plex-*` exporta;
 * `PlexSans_400Regular` (como o brand escreve) não existe e cairia em silêncio na fonte do sistema.
 */
export const FontFamily = {
  sans: 'IBMPlexSans_400Regular',
  sansMedium: 'IBMPlexSans_500Medium',
  sansSemiBold: 'IBMPlexSans_600SemiBold',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
} as const;

/** Escala 1,2 sobre base 16. Peso máximo é 600; não existe 700 nem itálico no sistema. */
export const Type = {
  label: {
    fontFamily: FontFamily.monoMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.96,
    textTransform: 'uppercase',
  },
  caption: { fontFamily: FontFamily.sans, fontSize: 13, lineHeight: 18 },
  body: { fontFamily: FontFamily.sans, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: FontFamily.sansSemiBold, fontSize: 16, lineHeight: 24 },
  title3: { fontFamily: FontFamily.sansSemiBold, fontSize: 19, lineHeight: 26 },
  title2: { fontFamily: FontFamily.sansSemiBold, fontSize: 23, lineHeight: 30 },
  title1: { fontFamily: FontFamily.sansSemiBold, fontSize: 28, lineHeight: 32 },
  display: { fontFamily: FontFamily.sansSemiBold, fontSize: 34, lineHeight: 38 },
  numeral: {
    fontFamily: FontFamily.monoMedium,
    fontSize: 56,
    lineHeight: 56,
    letterSpacing: -1.1,
  },
  numeralXL: {
    fontFamily: FontFamily.monoMedium,
    fontSize: 88,
    lineHeight: 84,
    letterSpacing: -1.8,
  },
} as const;

/**
 * Base 4. Atenção ao par `threeHalf` (12) e `three` (16): os nomes vêm do doc e `three` NÃO vale
 * 12 — quem escrever `Spacing.three` esperando 12 erra o layout sem ver.
 */
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  threeHalf: 12,
  three: 16,
  fourHalf: 20,
  four: 24,
  five: 32,
  six: 40,
  seven: 48,
  eight: 64,
} as const;

/** Canto firme de propósito: objeto de precisão não é bolha. */
export const Radius = { chip: 2, control: 6, card: 10, sheet: 16, pill: 999 } as const;

export const Gutter = 20;
export const MaxContentWidth = 640;
export const MinTapTarget = 48;

/* ---------------------------------------------------------------------------------------------
 * Compatibilidade com o template do Expo.
 *
 * Estes exports existem só porque `themed-text`, `themed-view`, `app-tabs(.web)`, `web-badge`,
 * `ui/collapsible` e as telas `index`/`explore` ainda dependem deles. Todos são removidos na
 * Task 7, junto com os componentes. Não usar em código novo.
 * ------------------------------------------------------------------------------------------- */

// task 7: `Fonts` some junto com `themed-text`
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

// task 7: inset da tab bar do template; a casca real calcula pela safe area
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;

/** Tradução temporária das chaves antigas para os tokens do brand. */
// task 7: remover com os componentes do template
export const LegacyColors = {
  text: Colors.dark.textPrimary,
  background: Colors.dark.canvas,
  backgroundElement: Colors.dark.surface,
  backgroundSelected: Colors.dark.raised,
  textSecondary: Colors.dark.textSecondary,
} as const;

// task 7: `ThemeColor` acompanha `LegacyColors`
export type ThemeColor = keyof typeof LegacyColors;
