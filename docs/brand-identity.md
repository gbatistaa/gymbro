# Gymbro — Identidade Visual

Documento de identidade do produto. Toda decisão aqui foi escolhida explicitamente; nada veio do
template do Expo. É a fonte de verdade para `mobile/src/constants/theme.ts`, `tailwind.config.js`
e para o desenho das telas.

Última atualização: entrevista concluída, sistema fechado.

---

## 0. O produto em uma frase

> O caderno de treino de quem já treina: registra carga, série e volume sem atrito e devolve a
> próxima decisão de progressão.

O valor do app está no número correto na hora certa. Não está em motivação, confete ou ilustração.
Toda escolha visual abaixo deriva disso.

---

## 1. Posicionamento

| Dimensão           | Decisão                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| Usuário central    | Intermediário, 1 a 3 anos de treino. Sabe o que é PR, volume e deload.                       |
| Sensação ao abrir | Ferramenta séria de progressão. Precisa, silenciosa, confiável.                             |
| Tema                | **Escuro apenas** no MVP. Claro entra depois como paleta própria, nunca como inversão. |
| Marca               | **Gymbro**, wordmark tipográfico.                                                       |
| Ambição visual    | Estrutura convencional de app + **um elemento-assinatura forte**.                        |
| Idioma e unidade    | PT-BR, kg, decimal com vírgula (`42,5 kg`).                                                 |
| Navegação         | 4 abas: Início, Treinar, Progresso, Perfil.                                                   |

### Contexto de uso que manda no design

Quatro vezes por semana, no meio do treino, uma mão livre, dedo com suor, luz dura de academia,
sinal instável. Cada toque a mais é custo. Cada ambiguidade numérica é erro de treino.

### Proibido

- Gradiente roxo/azul, glassmorphism como superfície padrão, card com borda lateral colorida.
- Copy motivacional: "supere seus limites", "desbloqueie", "transforme-se".
- Confete como recompensa principal. PR é dado, não festa.
- Ícone de chama, emoji no lugar de ícone, três cards iguais de ícone no onboarding.
- Emoji em qualquer lugar da interface.

---

## 2. Dials

| Dial       | Persuade (login, onboarding) | Experience (treino ao vivo, PR) | Operate (rotinas, ajustes) | Read (histórico, relatório) |
| ---------- | ---------------------------- | ------------------------------- | -------------------------- | ----------------------------- |
| Variância | média                       | **alta**                  | baixa                      | baixa                         |
| Movimento  | baixa                        | média                          | mínima                    | mínima                       |
| Densidade  | baixa                        | **alta**                  | média                     | alta                          |

A ousadia fica concentrada na tela de treino ao vivo. Formulário e configuração não recebem
espetáculo. A tela de treino é o único lugar onde o número vira arquitetura.

---

## 3. Elemento-assinatura: **caderno de treino**

O app é desenhado como uma folha de registro de treino, não como um feed de cards. Cinco regras
que valem em toda tela. Se uma tela viola uma delas, a tela está errada.

1. **Régua, não caixa.** Dados vivem em linhas separadas por uma hairline de 1px (`rule #3A3632`).
   Card com sombra é exceção, nunca o padrão de lista. Uma lista de exercícios não é uma pilha de
   cards.
2. **Número alinhado à direita, sempre tabular.** Toda coluna numérica (kg, reps, séries, volume,
   %) usa Plex Mono e alinha à direita. Números nunca centralizam, nunca são proporcionais.
3. **Anotação na margem.** Metadado curto (variação, `+2,5 kg`, `RPE 8`, `há 6 d`) vive numa
   gutter fixa à esquerda ou à direita, em Plex Mono 12px, cor `text-muted`. É o que faz a tela
   parecer um registro e não um dashboard.
4. **Cabeçalho de seção em mono, caixa alta, com régua que corre até a borda.** Ex.: `SEMANA 45`
   seguido de linha até o fim da coluna. Sem ícone decorativo ao lado.
5. **Um único numeral gigante por tela.** Apenas a entrada de série da tela de treino tem direito
   ao numeral de 88px. Se duas coisas gritam, nada grita.

O elemento-assinatura não é uma textura, é uma disciplina de layout. Custa zero de performance e
não envelhece.

---

## 4. Cor

Uma única cor de acento. Neutros tintados para o âmbar (hue ~38°), nunca cinza puro.

### Paleta escura (MVP)

| Token             | Hex         | Uso                                             | Contraste medido            |
| ----------------- | ----------- | ----------------------------------------------- | --------------------------- |
| `canvas`        | `#121110` | fundo da aplicação                            | —                          |
| `surface`       | `#1A1917` | linha agrupada, tab bar, sheet                  | 1.07 vs canvas              |
| `raised`        | `#232120` | input, botão secundário, linha pressionada    | 1.18 vs canvas              |
| `border`        | `#2E2B28` | contorno de card e sheet (decorativo)           | 1.34                        |
| `rule`          | `#3A3632` | hairline entre linhas de dado                   | 1.58                        |
| `borderStrong`  | `#787067` | contorno de input, indicador de foco            | **3.61** vs surface   |
| `textMuted`     | `#9A9188` | anotação de margem, label, texto desabilitado | **5.18** no pior caso |
| `textSecondary` | `#B8B0A6` | corpo secundário, unidade `kg`               | 7.48                        |
| `textPrimary`   | `#F2EEE8` | texto principal, giz                            | 13.87                       |
| `accent`        | `#F5B23D` | ação primária, PR, série concluída         | 8.64                        |
| `accentPressed` | `#D9931A` | estado pressionado do acento                    | 7.31                        |
| `accentTint`    | `#2B2218` | fundo de linha selecionada ou de destaque       | 1.19                        |
| `danger`        | `#F2665C` | apagar, erro de validação. Nunca decorativo.  | 5.21                        |
| `onAccent`      | `#121110` | texto sobre âmbar                              | 10.17                       |

### Regras de cor

- **Um acento só.** Não existe cor de sucesso verde. Série concluída é âmbar. Adicionar verde para
  "rescue" de layout é falha, não solução.
- **Vermelho é destrutivo.** Excluir rotina, erro de formulário, sessão abandonada. Se um elemento
  vermelho não destrói nada, ele está errado.
- **Estagnação e alerta** usam `accent` em contorno e `textMuted` no texto, nunca vermelho.
- Texto sobre âmbar é sempre `onAccent`, nunca branco (branco sobre âmbar dá 1.86:1).
- Desabilitado usa `textMuted` sobre `raised` e mantém contraste ≥ 4.5. Cinza sobre cinza é bug.
- Nada de opacidade para indicar estado. Estado é troca de token.

### Tema claro (pós-MVP)

Paleta própria em papel quente (`#F7F5F1` de canvas, tinta `#1A1917`), mesmo acento, com âmbar
escurecido para `#8A6410` quando precisar de contraste sobre papel. Não é inversão da escura.

---

## 5. Tipografia

**Famílias:** IBM Plex Sans (interface) + IBM Plex Mono (todo número, toda anotação de margem).
Duas famílias, nunca três. Plex Mono é monoespaçada por construção, então a tabularidade é
garantida e `42,5` ocupa a mesma largura que `40,0`.

### Escala (razão 1,2 sobre base 16)

| Token          | Família | Tamanho | Entrelinha | Peso | Uso                                                                              |
| -------------- | -------- | ------- | ---------- | ---- | -------------------------------------------------------------------------------- |
| `label`      | Mono     | 12      | 16         | 500  | Cabeçalho de seção, chip, anotação de margem. Caixa alta, tracking +0.08em. |
| `caption`    | Sans     | 13      | 18         | 400  | Texto auxiliar, timestamp, dica de campo.                                        |
| `body`       | Sans     | 16      | 24         | 400  | Texto padrão, nome de exercício.                                               |
| `bodyStrong` | Sans     | 16      | 24         | 600  | Nome de exercício ativo, valor editável.                                       |
| `title3`     | Sans     | 19      | 26         | 600  | Título de seção, título de sheet.                                            |
| `title2`     | Sans     | 23      | 30         | 600  | Título de tela.                                                                 |
| `title1`     | Sans     | 28      | 32         | 600  | Título de tela principal, nome de rotina.                                       |
| `display`    | Sans     | 34      | 38         | 600  | Número de destaque em dashboard (volume da semana).                             |
| `numeral`    | Mono     | 56      | 56         | 500  | Peso/reps em edição na tela de treino.                                         |
| `numeralXL`  | Mono     | 88      | 84         | 500  | Único por tela. Peso da série ativa.                                           |

Tracking: `numeral` e `numeralXL` em `-0.02em`. `label` em `+0.08em`. Corpo em `0`.
Medida de linha: máximo 68 caracteres. Em 390px de largura isso nunca é problema, mas no web
(Expo web) o conteúdo para em 640px.

### Regras de tipografia

- Peso máximo é 600. Não existe 700 nem 800 no sistema.
- Itálico não é usado. Ênfase é peso e cor, não itálico.
- Nunca dois tamanhos na mesma linha sem alinhamento óptico. Número e unidade alinham pela linha
  de base: `42,5` em `numeral`, `kg` em `body` `textSecondary`, separados por 4px.
- Decimal sempre com vírgula. Separador de milhar com ponto: `12.480 kg`.
- Números em contexto de lista podem ser `body` desde que Mono.

### Marca

`GYMBRO` em Plex Sans SemiBold, caixa alta, tracking `-0.02em`, cor `textPrimary`.
Sem símbolo, sem mascote, sem ponto final. O ícone do app é a letra `G` no mesmo peso, âmbar sobre
`canvas`, com 18% de padding de safe area.

---

## 6. Espaço, raio, elevação

### Espaçamento (base 4)

`2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64`. Nenhum valor fora dessa lista.
O `Spacing` atual em `theme.ts` mantém os apelidos `half, one, two, three, four, five, six` e
ganha `threeHalf = 12` e `fourHalf = 20`.

| Uso                              | Valor                                                   |
| -------------------------------- | ------------------------------------------------------- |
| Gutter lateral de tela           | 20                                                      |
| Padding interno de linha de dado | 16 vertical, 0 horizontal (a régua corre até a borda) |
| Gap entre label e campo          | 8 (sempre menor que o gap entre campos, que é 20)      |
| Padding de sheet                 | 20                                                      |
| Altura de alvo de toque          | mínimo 48                                              |

### Raio

`2` chip e tag · `6` input e botão · `10` card e sheet pequeno · `16` sheet · `999` apenas o
indicador de aba ativa e o badge de PR.

Raio pequeno de propósito. Objeto de precisão tem canto firme.

### Elevação

Sem sombra em superfície normal. Hierarquia é feita por degrau de superfície (`canvas` →
`surface` → `raised`) e por régua. Única exceção: sheet modal no iOS recebe sombra nativa.

### Grade

4 colunas em 320, 4 em 390, 8 em 768. Gutter 20 até 640, 32 acima disso. Largura máxima de
conteúdo 640 no web. A borda esquerda do conteúdo alinha em todas as seções, sem exceção.

---

## 7. Ícones e imagem

- **Uma família:** Feather, via `@expo/vector-icons`, traço 2px, grade 24px, cor herdada do texto.
  Tamanhos permitidos: 16, 20, 24. Nunca 32.
- Nenhuma foto de atleta. Nenhuma ilustração. Estado vazio é texto em `textMuted` mais uma ação,
  não uma arte.
- Ícones de aba: `home`, `play`, `trending-up`, `user`. Aba ativa é `accent` e ganha o indicador
  de 2px; inativa é `textMuted`. Sem rótulo de texto na tab bar.
- O ícone nunca substitui um rótulo em ação destrutiva.

---

## 8. Movimento

| Situação                            | Duração                           | Curva                  |
| ------------------------------------- | ----------------------------------- | ---------------------- |
| Toque, hover, foco                    | 120ms                               | `ease-out`           |
| Troca de estado de linha, chip, badge | 160ms                               | `ease-out`           |
| Entrada de sheet / modal              | 200ms                               | `ease-out`           |
| Saída de sheet / modal               | 160ms                               | `ease-in`            |
| Troca de dígito do numeral           | 180ms, deslocamento vertical de 8px | `ease-out`, sem mola |

- Anima só `transform` e `opacity`. Nunca `width`, `height`, `top`, `left`.
- Sem mola, sem bounce, sem overshoot. O app é um instrumento.
- PR não dispara animação de confete. O badge `PR` entra em 160ms e vibra uma vez (`expo-haptics`,
  `impactLight`).
- `prefers-reduced-motion` e `AccessibilityInfo.isReduceMotionEnabled`: todo movimento vira troca
  instantânea de estado, exceto o feedback háptico.

---

## 9. Estados obrigatórios

Todo elemento interativo entrega os oito. Componente com metade disso está incompleto, por bonito
que seja.

| Estado              | Regra visual                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| default             | `textPrimary` sobre `canvas`, régua em `rule`                                                 |
| hover (web)         | fundo `surface`, régua mantida                                                                    |
| pressed             | fundo `raised`, 120ms, sem fade de opacidade                                                       |
| focus-visible (web) | contorno 2px `borderStrong`, offset 2px. Nunca remover outline.                                    |
| disabled            | texto `textMuted`, fundo `raised`, sem contorno, sem animação                                  |
| loading             | numeral substituído por 3 barras de `rule` pulsando em opacidade 0.4→0.8, nunca spinner circular |
| empty               | uma frase em `caption` `textMuted` + uma ação em `accent`                                    |
| error               | texto `danger` em `caption` abaixo do campo + contorno `danger`. Mensagem diz o que fazer.     |

Ação primária: fundo `accent`, texto `onAccent`, altura 48, raio 6, largura total.
Ação secundária: fundo `raised`, texto `textPrimary`.
Ação destrutiva: texto `danger`, sem fundo, sempre com confirmação.

---

## 10. Tokens para implementação

```ts
// mobile/src/constants/theme.ts
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

export const FontFamily = {
  sans: 'PlexSans_400Regular',
  sansMedium: 'PlexSans_500Medium',
  sansSemiBold: 'PlexSans_600SemiBold',
  mono: 'PlexMono_400Regular',
  monoMedium: 'PlexMono_500Medium',
} as const;

export const Type = {
  label:       { fontFamily: FontFamily.monoMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.96, textTransform: 'uppercase' },
  caption:     { fontFamily: FontFamily.sans, fontSize: 13, lineHeight: 18 },
  body:        { fontFamily: FontFamily.sans, fontSize: 16, lineHeight: 24 },
  bodyStrong:  { fontFamily: FontFamily.sansSemiBold, fontSize: 16, lineHeight: 24 },
  title3:      { fontFamily: FontFamily.sansSemiBold, fontSize: 19, lineHeight: 26 },
  title2:      { fontFamily: FontFamily.sansSemiBold, fontSize: 23, lineHeight: 30 },
  title1:      { fontFamily: FontFamily.sansSemiBold, fontSize: 28, lineHeight: 32 },
  display:     { fontFamily: FontFamily.sansSemiBold, fontSize: 34, lineHeight: 38 },
  numeral:     { fontFamily: FontFamily.monoMedium, fontSize: 56, lineHeight: 56, letterSpacing: -1.1 },
  numeralXL:   { fontFamily: FontFamily.monoMedium, fontSize: 88, lineHeight: 84, letterSpacing: -1.8 },
} as const;

export const Spacing = {
  half: 2, one: 4, two: 8, threeHalf: 12, three: 16, fourHalf: 20,
  four: 24, five: 32, six: 40, seven: 48, eight: 64,
} as const;

export const Radius = { chip: 2, control: 6, card: 10, sheet: 16, pill: 999 } as const;
export const Gutter = 20;
export const MaxContentWidth = 640;
export const MinTapTarget = 48;
```

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      canvas: '#121110', surface: '#1A1917', raised: '#232120',
      border: '#2E2B28', rule: '#3A3632', borderStrong: '#787067',
      muted: '#9A9188', secondary: '#B8B0A6', primary: '#F2EEE8',
      accent: '#F5B23D', accentPressed: '#D9931A', accentTint: '#2B2218',
      danger: '#F2665C', onAccent: '#121110',
    },
    borderRadius: { chip: '2px', control: '6px', card: '10px', sheet: '16px' },
  },
}
```

Dependências que a implementação exige (nenhuma instalada hoje):
`npx expo install @expo-google-fonts/ibm-plex-sans @expo-google-fonts/ibm-plex-mono @expo/vector-icons`
`expo-font` já está no projeto. `expo-haptics` é opcional, só para o feedback de PR e de série.

---

## 11. Checklist de verificação

Antes de considerar uma tela pronta:

- [ ] Em 3 segundos, dá para dizer o que a tela faz.
- [ ] A borda esquerda do conteúdo alinha com a tela anterior.
- [ ] Todo número está em Mono, tabular, alinhado à direita, com vírgula decimal.
- [ ] Nenhuma tela tem dois numerais gigantes.
- [ ] Toda lista de dado usa régua, não card com sombra.
- [ ] Nenhum texto abaixo de 4.5:1 e nenhum alvo de toque abaixo de 48×48.
- [ ] Os oito estados existem em cada elemento interativo.
- [ ] Em 320px nada quebra, transborda ou encolhe abaixo de 12px.
- [ ] Removendo toda decoração, a hierarquia continua de pé.
- [ ] Nenhum emoji, nenhuma copy motivacional, nenhuma segunda cor de acento.
- [ ] `npx tsc --noEmit` e `npx expo lint` passam.

---

## 12. Ordem de implementação

1. Tokens (`theme.ts`, `tailwind.config.js`) e carregamento das fontes no `_layout.tsx`.
2. Primitivos: `Text` tipado por token, `Rule`, `DataRow`, `Label`, `Button`, `Numeral`.
3. Casca: 4 abas com ícones Feather e indicador de aba ativa.
4. Tela de treino ao vivo (o elemento-assinatura em escala máxima).
5. Início, Progresso, Perfil.
6. Revisão de contraste e de estados tela a tela.
