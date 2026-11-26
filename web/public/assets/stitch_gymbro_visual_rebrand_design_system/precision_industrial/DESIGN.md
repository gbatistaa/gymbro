---
name: Precision Industrial
colors:
  surface: '#0D120F'
  surface-dim: '#111413'
  surface-bright: '#373a38'
  surface-container-lowest: '#0c0f0d'
  surface-container-low: '#1a1c1b'
  surface-container: '#1e201f'
  surface-container-high: '#282a29'
  surface-container-highest: '#333534'
  on-surface: '#e2e3e0'
  on-surface-variant: '#bacbb7'
  inverse-surface: '#e2e3e0'
  inverse-on-surface: '#2f312f'
  outline: '#859582'
  outline-variant: '#3b4b3b'
  surface-tint: '#00e560'
  primary: '#f3ffef'
  on-primary: '#003912'
  primary-container: '#39ff74'
  on-primary-container: '#00722c'
  inverse-primary: '#006e2a'
  secondary: '#7bd0ff'
  on-secondary: '#00354a'
  secondary-container: '#00a6e0'
  on-secondary-container: '#00374d'
  tertiary: '#fffaf9'
  on-tertiary: '#670211'
  tertiary-container: '#ffd5d3'
  on-tertiary-container: '#ad393d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6aff87'
  primary-fixed-dim: '#00e560'
  on-primary-fixed: '#002108'
  on-primary-fixed-variant: '#00531e'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#7bd0ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#ffdad8'
  tertiary-fixed-dim: '#ffb3b0'
  on-tertiary-fixed: '#410006'
  on-tertiary-fixed-variant: '#881d24'
  background: '#111413'
  on-background: '#e2e3e0'
  surface-variant: '#333534'
  canvas: '#060807'
  raised: '#141C17'
  border: '#1F2B23'
  rule: '#2A3830'
  border-strong: '#3D5246'
  neon-pressed: '#22C55E'
  neon-tint: '#0A2312'
  info-tint: '#081B2B'
  text-primary: '#F1F7F3'
  text-secondary: '#C6D2CC'
  text-muted: '#8FA397'
  on-accent: '#040D07'
typography:
  numeral-xl:
    fontFamily: IBM Plex Mono
    fontSize: 88px
    fontWeight: '500'
    lineHeight: 84px
    letterSpacing: -0.02em
  numeral-lg:
    fontFamily: IBM Plex Mono
    fontSize: 56px
    fontWeight: '500'
    lineHeight: 56px
    letterSpacing: -0.02em
  numeral-md:
    fontFamily: IBM Plex Mono
    fontSize: 34px
    fontWeight: '500'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 23px
    fontWeight: '600'
    lineHeight: 30px
  headline-sm:
    fontFamily: IBM Plex Sans
    fontSize: 19px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: IBM Plex Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-mono:
    fontFamily: IBM Plex Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.08em
  label-sm:
    fontFamily: IBM Plex Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-desktop: 2rem
  margin: 1.25rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
---

## Brand & Style

The design system embodies the rigor of precision industrial instrumentation and technical workout ledgers. Tailored for intermediate and advanced weightlifters operating in challenging physical environments (sweat, chalk, high gym glare, single-handed mobile operation), the visual tone discards cartoon gamification, streaks, amber warnings, and motivational fluff in favor of utilitarian clarity and engineered discipline.

The aesthetic fuses German technical typography, precision tachometers, and mechanical instrument panels. It prioritizes the instantaneous reading of loads, reps, RPE, and delta progression over decorative fluff. Layouts rely on continuous horizontal divider lines, baseline-aligned tabular numerals, and disciplined low-contrast dark surfaces rather than floating cards or blurred glassmorphism.

## Colors

The color system operates on an uncompromising dark mode baseline where hue assignments carry strict operational meaning:

- **Neon Volt (`primary_color_hex: #39FF74`)**: Reserved strictly for affirmative physical progression, completed workout sets, the active navigation tab indicator, and primary CTAs. It pairs with `#040D07` (`on-accent`) for razor-sharp legibility. Under interaction, it transitions to `#22C55E` (`neon-pressed`), with `#0A2312` (`neon-tint`) serving as an active set background highlight.
- **Info Cyan (`secondary_color_hex: #38BDF8`)**: Designated for non-blocking technical telemetry, RPE indicators, session metadata, contextual navigation, and margin deltas (such as `+2,5 kg`). It operates inside `#081B2B` (`info-tint`) when enclosed in chips.
- **Danger Red (`tertiary_color_hex: #F87171`)**: Reserved exclusively for terminal validations, missed attempts, and destructive confirmations.
- **Tonal Foundations**: The canvas sits at `#060807` (deep charcoal-black infused with a slight olive undertone), stepped up to `#0D120F` for pinned bars/surfaces, and `#141C17` for raised stepper controls and input fields.
- **Structural Rules**: Boundaries avoid heavy fills, relying instead on `#1F2B23` for 1px hairline component perimeters and `#2A3830` for horizontal data ledgers. Focus rings demand high-visibility 2px borders using `#3D5246`.

## Typography

The typographic hierarchy enforces a disciplined dual-engine system:
1. **Interface Engine (`IBM Plex Sans`)**: Drives general UI communication, exercise taxonomy, and structural headlines. Weights are capped at `600` (SemiBold) to avoid muddy ink-traps on mobile OLED displays.
2. **Telemetry & Ledger Engine (`IBM Plex Mono`)**: Governs all numerical inputs, metrics, RPE, timestamps, and section headers. 

Numerical figures always employ `font-variant-numeric: tabular-nums` and right alignment within metric tables. When displaying loads or weights, the unit (`kg`) sits along the shared typographical baseline in `body-sm` (`#C6D2CC`), while the weight integer scales to dominant sizes. Section labels are set in uppercase monospace with expanded tracking (`0.08em`), trailed by an inline horizontal rule extending to the edge of the content container.

## Layout & Spacing

The layout is built around a rigorous 4px incremental rhythm: `2px`, `4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `40px`, `48px`, and `64px`.

### Grid & Ergonomic Boundaries
- **Mobile Handheld (320px – 430px)**: 1.25rem (20px) horizontal page margins. Interactive elements maintain an absolute minimum touch boundary of `48px × 48px` to guarantee error-free input during heavy training sets.
- **Reading & Form Constraints**: Forms, live set counters, and workout feeds constrain their maximum column width to `640px` centered on wide viewports, preserving immediate vertical scanning without lateral eye fatigue.
- **PWA Safe Zones**: Fixed bottom navigation bars and floating quick-log steppers mandate dynamic bottom padding using `env(safe-area-inset-bottom)` plus 16px to prevent system gesture collisions.
- **Data Rhythm**: Tabular ledger rows use a standardized 16px vertical padding, separated by continuous 1px hairline horizontal rules.

## Elevation & Depth

Visual hierarchy rejects decorative drop shadows, blurred glass layers, and ambient glows. Instead, depth is articulated through precise **tonal surfaces** and **hairline borders**:

1. **Canvas Layer (`#060807`)**: The lowest plane. Hosts all standard page transitions and scroll areas.
2. **Structural Surface (`#0D120F`)**: Permanent system boundaries, including pinned bottom navigation docks, fixed top app headers, and sticky session headers.
3. **Interactive & Raised Containers (`#141C17`)**: Steppers, numeric dials, active input fields, and secondary control blocks.
4. **Dividers & Rules (`#2A3830`)**: Replaces traditional card wrappers. Data points live on single horizontal tracks delineated by 1px solid rules.
5. **Overlays & Dialogs**: The only elements permitted a box shadow. Modals, bottom sheets, and select menus use an ultra-crisp drop shadow: `0 8px 32px rgba(0, 0, 0, 0.85)` coupled with a 1px perimeter border in `#1F2B23`.

## Shapes

The design language uses firm, disciplined geometry inspired by mechanical casings and machine-tooled instruments. Roundedness is kept minimal:

- **Tags & Indicators**: 2px corner radius for ultra-compact tags, RPE tags, and status badges.
- **Inputs & Controls**: 6px corner radius for form inputs, primary action buttons, and numeric adjustment steppers.
- **Containers & Banners**: 10px corner radius for self-contained persistent state banners (such as active ongoing session cards).
- **Modals & Overlays**: 16px corner radius for bottom action sheets and center-stage confirmation dialogs.
- **Pills**: Used strictly for navigation dot indicators and tab state markers.

## Components

### Buttons & Action Controls
- **Primary CTA**: Minimum height 48px, background `#39FF74`, typography IBM Plex Sans 600 in `#040D07`, border-radius 6px. On `:active`, shifts immediately (120ms ease-out) to `#22C55E`. Full width on mobile form views.
- **Secondary / Stepper Control**: Minimum target 48x48px, background `#141C17`, 1px border in `#1F2B23`, typography IBM Plex Sans 500 in `#F1F7F3`.
- **Destructive Button**: Background transparent or `#141C17`, 1px border in `#F87171`, text `#F87171`. Always mandates explicit confirmation when discarding logged sets.

### Data Rows & "Caderno" Ledgers
- Replaces cards with linear ledger rows. Each row contains:
  1. Exercise/metric title in `#F1F7F3` (IBM Plex Sans 400).
  2. Trailing numeric value in `#F1F7F3` (IBM Plex Mono 500, tabular-nums, right-aligned).
  3. Inline baseline unit `kg` or `reps` in `#C6D2CC`.
  4. Subtle delta or margin metadata (`+2,5 kg`) in `#38BDF8`.
  5. Continuous bottom border in `1px solid #2A3830`.

### Monospace Section Headers
- Rendered using `label-mono`: IBM Plex Mono, 12px, 500, uppercase, letter-spacing `0.08em`, color `#8FA397`.
- Immediately accompanied by a baseline-aligned 1px horizontal rule (`#2A3830`) filling 100% of remaining row width.

### Form Inputs & Numeric Steppers
- Height 48px, background `#141C17`, border `1px solid #1F2B23`, text color `#F1F7F3`, font IBM Plex Mono.
- Focus state applies a mandatory `2px solid #3D5246` outline with 2px offset.
- Labels are always persistent above the input (never placeholder-only).

### Active Workout HUD
- Highlights the current live set using `#0A2312` background tint with an active left edge or border accent in `#39FF74`.
- The dominant active load numeral uses `numeral-lg` (56px) or `numeral-xl` (88px) in IBM Plex Mono to ensure instant legibility from arm's length on a gym bench.

### Bottom Navigation Bar (Mobile PWA)
- Fixed container at `#0D120F`, top hairline border `1px solid #1F2B23`.
- Four persistent destinations: Início, Treinar, Progresso, Perfil.
- Each item occupies a minimum 48x48px hit target, pairing an SVG icon (stroke width 2px) with a persistent visible text label.
- Active item uses `#39FF74` for icon and text, plus a subtle top indicator dot or bar.