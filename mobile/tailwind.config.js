/** @type {import('tailwindcss').Config} */

// Espelho de `src/constants/theme.ts` para o NativeWind. Toda cor, família, tamanho e raio daqui
// existe lá também; divergir cria duas verdades sobre a mesma decisão.
//
// Classes geradas: `bg-canvas`, `text-primary`, `border-rule`, `rounded-control`,
// `text-numeral` (tamanho) + `font-mono` (família). Os nomes camelCase vêm do brand literalmente.
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas: '#121110',
        surface: '#1A1917',
        raised: '#232120',
        border: '#2E2B28',
        rule: '#3A3632',
        borderStrong: '#787067',
        muted: '#9A9188',
        secondary: '#B8B0A6',
        primary: '#F2EEE8',
        accent: '#F5B23D',
        accentPressed: '#D9931A',
        accentTint: '#2B2218',
        danger: '#F2665C',
        onAccent: '#121110',
      },
      borderRadius: {
        chip: '2px',
        control: '6px',
        card: '10px',
        sheet: '16px',
        pill: '999px',
      },
      fontFamily: {
        sans: ['IBMPlexSans_400Regular'],
        sansMedium: ['IBMPlexSans_500Medium'],
        sansSemiBold: ['IBMPlexSans_600SemiBold'],
        mono: ['IBMPlexMono_400Regular'],
        monoMedium: ['IBMPlexMono_500Medium'],
      },
      fontSize: {
        label: ['12px', { lineHeight: '16px' }],
        caption: ['13px', { lineHeight: '18px' }],
        body: ['16px', { lineHeight: '24px' }],
        title3: ['19px', { lineHeight: '26px' }],
        title2: ['23px', { lineHeight: '30px' }],
        title1: ['28px', { lineHeight: '32px' }],
        display: ['34px', { lineHeight: '38px' }],
        numeral: ['56px', { lineHeight: '56px' }],
        numeralXL: ['88px', { lineHeight: '84px' }],
      },
      // separado porque a brand fixa o tracking por token (-0.02em no numeral, +0.08em no label)
      letterSpacing: {
        numeral: '-1.1px',
        numeralXL: '-1.8px',
        label: '0.96px',
      },
    },
  },
  plugins: [],
};
