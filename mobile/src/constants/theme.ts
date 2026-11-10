/**
 * Tokens do Gymbro.
 *
 * `docs/brand-identity.md` §10 é a fonte de verdade: nenhum valor aqui pode ser inventado, e
 * nenhuma tela deve escrever cor, tamanho ou espaçamento que não venha deste arquivo.
 *
 * Tipografia, espaçamento, raio e largura máxima vivem em `tailwind.config.js` — é o que o
 * NativeWind compila. Este arquivo guarda o que **não** pode ser classe: cores lidas por APIs
 * imperativas (ripple, placeholder, Toaster), famílias para o Toaster, e os poucos valores usados
 * dentro de `Animated` e de estilos de navegação.
 *
 * Escala de 4 no NativeWind: a escala numérica do Tailwind já coincide com a do brand
 * (1=4, 2=8, 3=12, 4=16, 5=20, 6=24, 8=32, 10=40, 12=48, 16=64), então não sobrescrevemos
 * `spacing` — duas verdades sobre o mesmo número é como o layout diverge.
 */

import '@/global.css';

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

/**
 * Base 4, para o que **não** aceita classe: estilos de `Animated` e a tab bar do React Navigation.
 * A escala numérica do Tailwind espelha estes valores (1=4, 2=8, 3=12, 4=16, 5=20, 6=24, 8=32).
 * Atenção: `three` é 16 e `threeHalf` é 12 — o nome engana.
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

export const Radius = { chip: 2, control: 6, card: 10, sheet: 16, pill: 999 } as const;

