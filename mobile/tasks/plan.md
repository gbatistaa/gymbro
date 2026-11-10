# Implementation Plan: App mobile do Gymbro

## Overview

Construir o cliente mobile do Gymbro em Expo/React Native consumindo a API que acabou de ser
fechada (`backend/tasks/api-mobile/`). O objetivo não é "um app que funciona": é o **caderno de
treino** descrito em `docs/brand-identity.md` — régua em vez de card, número tabular à direita,
anotação na margem, um único numeral gigante por tela.

A ordem segue o valor: sem login não há dado; sem rotina não há treino; sem treino não há
progresso. Tudo o que é maturidade (a11y, motion, performance, web) vem depois de o laço principal
estar completo e usável no meio de uma academia, com uma mão e sinal ruim.

**Escopo explícito:** online-only no MVP (decisão registrada no backend). Não há fila local, sync
ou estado offline persistente. Falha de rede é erro visível com retry manual.

## Architecture Decisions

- **Bearer, não cookie.** O backend devolve `{accessToken, tokenType, expiresIn, refreshToken}`.
  Access token vive **em memória** (átomo Jotai); refresh token vai para `expo-secure-store`.
  No alvo web não há armazenamento de refresh: sessão só em memória, exige login por aba. Guardar
  token em `localStorage` é XSS com outro nome.
- **`expo-router` com grupos de rota**, não `NativeTabs` do template. O brand exige ícone Feather e
  **indicador de 2px na aba ativa**; `NativeTabs` delega ao UIKit/SwiftUI e não permite essa
  precisão. Estrutura: `(auth)` para login/registro, `(tabs)` para as quatro abas, `session/[id]`
  fora das abas (tela cheia, sem barra).
- **NativeWind + tokens do Tempo TS.** Tokens em `src/constants/theme.ts` (fonte de verdade) e
  espelhados em `tailwind.config.js` **completo** (cor, família, tamanho, espaçamento, raio). Sem
  espelho, as duas verdades divergem em uma semana.
- **Tipos da API vêm do contrato gerado**, não de DTO redigitado: `src/lib/api/schema.d.ts`
  (via `npm run api:types`). Zod fica para **validação de formulário** apenas — o mesmo schema não
  serve para as duas coisas.
- **Erro do backend é tratado por `code`**, nunca por texto: `{timestamp,status,code,message,path,
  errors[]}`. Um mapa `code → mensagem PT-BR` centraliza o que o usuário lê.
- **Um numeral XL por tela, e é a tela de treino.** Regra de arquitetura, não de estilo: qualquer
  outro `numeralXL` é bug de design, não escolha.
- **Densidade e ambição por modo de tela** (brand §2): Persuade = login/onboarding; Experience =
  treino ao vivo (única com variância alta); Operate = rotinas e ajustes; Read = histórico.
- **Sem biblioteca de UI.** O sistema é pequeno e específico (régua, gutter, mono). Trazer
  Tamagui/shadcn obrigaria a anular o padrão visual de fora.

## Rotina por tela (how every screen task is done)

Vale para toda task que cria tela. É o processo das quatro skills, nesta ordem:

1. **Briefar** (`design-craft` §1–§2): uma frase — *"esta tela é sobre ___, e a ideia visual que
   carrega isso é ___"* — e os três dials (variância, movimento, densidade) para o modo da tela.
2. **Estruturar** (`design-mobile-apps`): anatomia, navegação, gestos, teclado, safe area, os oito
   estados. Sem cor final.
3. **Implementar** com os primitivos da Fase 0. Nenhuma tela inventa espaçamento, tamanho ou cor.
4. **Mover** (`emil-design-eng`): só depois da estrutura correta. Timing da brand §8 (120/160/180/200ms).
5. **Auditar** (`web-design-guidelines` para web/a11y; `design-craft` §5 para o render).
6. **Gate**: checklist do brand §11 inteiro + `npx tsc --noEmit` + `npx expo lint`.

Regra de conflito, a mesma do backend: **`design-craft` > `design-mobile-apps` > `emil-design-eng`
> `web-design-guidelines`**. Se o craft bane algo que o emil recomenda, o banimento vence.

## Skills por fase

| Fase | Skills | Papel |
|---|---|---|
| 0 — Fundação | `design-craft` (decide), `design-mobile-apps` (anatomia de tabs/primitivos) | Tokens e primitivos nascem aqui; nenhum movimento ainda |
| 1 — Sessão | `design-craft` (dials Persuade), `web-design-guidelines` (focus/teclado no web) | Login é a única tela "de fora" do produto |
| 2 — Catálogo/rotinas | `design-mobile-apps` (listas, sheets, drag) | Modo Operate: variância baixa |
| 3 — Treino ao vivo | `design-craft` (elemento-assinatura), `emil-design-eng` (numeral, háptico), `design-mobile-apps` (teclado decimal) | A única tela com variância alta e movimento médio |
| 4 — Progresso | `design-craft` (modo Read), `design-mobile-apps` | Densidade alta, movimento mínimo |
| 5 — Perfil/dados | `design-mobile-apps`, `design-craft` (empty states) | Operate + ações destrutivas |
| 6 — Maturidade | `emil-design-eng` (auditoria de motion), `web-design-guidelines` (a11y + web), `design-craft` §5 (gate) | Nada de novo; tudo rebaixado ao padrão |

> `design-mobile-apps` é uma skill de **API externa** (sleek.design) e exige `SLEEK_API_KEY`.
> Sem chave, a Etapa 2 (estruturar) é feita pelo `design-craft` + anatomia nativa, e a skill fica
> reservada para quando houver chave. Isto é uma pergunta aberta, não um bloqueio.

## Task List

### Fase 0 — Fundação visual

- [ ] Task 1: `app.json` escuro e marca
- [ ] Task 2: Tokens espelhados (`theme.ts` + `tailwind.config.js` + `global.css`)
- [ ] Task 3: Fontes IBM Plex carregadas no root
- [ ] Task 4: Primitivos de layout (`Rule`, `Label`, `SectionHeader`, `Screen`)
- [ ] Task 5: Primitivos de dado (`Text` tipado, `DataRow`, `Numeral`, `Button`)
- [ ] Task 6: Casca de quatro abas com Feather
- [ ] Task 7: Remover o template do Expo

**Checkpoint Fase 0**
- [ ] App abre escuro, sem flash claro, com Plex em Sans e Mono
- [ ] Quatro abas com ícone Feather e indicador de 2px na ativa
- [ ] `npx tsc --noEmit` e `npx expo lint` verdes

### Fase 1 — Sessão e cliente de API

- [ ] Task 8: `api/client.ts` com Bearer e erro tipado
- [ ] Task 9: Mapa `code → mensagem PT-BR`
- [ ] Task 10: Armazenamento de tokens (`secure-store` + memória)
- [ ] Task 11: Refresh automático em 401
- [ ] Task 12: Tela de login
- [ ] Task 13: Tela de registro

**Checkpoint Fase 1**
- [ ] Login real contra o backend local; rotas protegidas respondem 200
- [ ] Token expirado → refresh transparente → requisição original refeita
- [ ] Refresh inválido → volta ao login limpando o storage

### Fase 2 — Catálogo e rotinas

- [ ] Task 14: Lista de exercícios com busca e paginação
- [ ] Task 15: Criar e editar exercício em sheet
- [ ] Task 16: Lista de rotinas
- [ ] Task 17: Detalhe da rotina
- [ ] Task 18: Editar itens da rotina (adicionar, remover, reordenar)

**Checkpoint Fase 2**
- [ ] É possível criar uma rotina com três exercícios e reordená-los
- [ ] Toda lista usa régua; nenhum card com sombra como padrão

### Fase 3 — Treino ao vivo (elemento-assinatura)

- [ ] Task 19: Iniciar e retomar sessão
- [ ] Task 20: Tela de treino com numeral XL
- [ ] Task 21: Entrada de série com teclado decimal
- [ ] Task 22: Concluir ou abandonar sessão
- [ ] Task 23: Badge de PR e volume total
- [ ] Task 24: Estados de rede e erro no meio do treino

**Checkpoint Fase 3**
- [ ] Registrar 4 séries de 2 exercícios e concluir a sessão em um device real
- [ ] Um único `numeralXL` na tela
- [ ] Sinal cair no meio: erro claro, sem perder a série digitada

### Fase 4 — Progresso e histórico

- [ ] Task 25: Dashboard de progresso
- [ ] Task 26: Histórico de sessões
- [ ] Task 27: Detalhe de sessão
- [ ] Task 28: Estatística por exercício e próximo alvo

**Checkpoint Fase 4**
- [ ] Dashboard bate com o backend para um usuário com 3 semanas de dados
- [ ] Streak, volume e PRs conferem com o cálculo do servidor

### Fase 5 — Perfil e dados pessoais

- [ ] Task 29: Perfil com nome, e-mail e fuso
- [ ] Task 30: Bioimpedância — lista e tendência
- [ ] Task 31: Exclusão de conta

**Checkpoint Fase 5**
- [ ] Trocar fuso muda a semana do dashboard
- [ ] Excluir conta apaga tudo e volta ao login

### Fase 6 — Maturidade

- [ ] Task 32: Acessibilidade (labels, alvos de toque, tipo dinâmico)
- [ ] Task 33: Auditoria de movimento e `reduced motion`
- [ ] Task 34: Alvo web (fontes, 640px, `focus-visible`)
- [ ] Task 35: Performance de listas e tempo de abertura
- [ ] Task 36: Revisão tela a tela com o checklist do brand

**Checkpoint Final**
- [ ] Checklist do `brand-identity.md` §11 marcado em todas as telas
- [ ] Nenhum emoji, nenhuma segunda cor de acento, nenhum gradiente
- [ ] `npx tsc --noEmit` e `npx expo lint` verdes

---

## Task 1: `app.json` escuro e marca

**Description:** O `app.json` ainda é o do template Expo: `userInterfaceStyle: "automatic"`, splash
`#208AEF`, ícone adaptativo azul claro e `name: "mobile"`. Isso contradiz "escuro apenas" e produz
um flash claro no launch.

**Acceptance criteria:**
- [ ] `userInterfaceStyle: "dark"`, `name`/`slug`/`scheme` = `gymbro`
- [ ] Cor de fundo do splash e do ícone adaptativo = `#121110`
- [ ] `expo-splash-screen` configurado com `dark` como único tema

**Verification:**
- [ ] Manual: abrir no simulador em modo claro do sistema → nenhum flash branco
- [ ] Build succeeds: `npx expo config --type public` sem erro

**Dependencies:** None
**Files likely touched:** `mobile/app.json`, `mobile/assets/images/*`
**Estimated scope:** S

---

## Task 2: Tokens espelhados

**Description:** Substituir o `theme.ts` do template pelos tokens do brand §10 e espelhar tudo em
`tailwind.config.js`: cores, famílias, escala tipográfica, espaçamento, raios. O `global.css`
também aponta fonte do template e precisa apontar Plex no alvo web.

**Acceptance criteria:**
- [ ] `Colors.dark` tem os 14 tokens exatos do brand; `light` não existe como paleta ativa
- [ ] `Type`, `Spacing`, `Radius`, `Gutter`, `MaxContentWidth`, `MinTapTarget` conforme §10
- [ ] `tailwind.config.js` expõe `bg-canvas`, `text-primary`, `rounded-control`, `text-numeral`
- [ ] `global.css` usa IBM Plex nas variáveis `--font-display` e `--font-mono`

**Verification:**
- [ ] Manual: tela de teste com `bg-canvas text-primary text-numeral` renderiza
- [ ] `npx tsc --noEmit`

**Dependencies:** None
**Files likely touched:** `src/constants/theme.ts`, `tailwind.config.js`, `src/global.css`
**Estimated scope:** M

---

## Task 3: Fontes IBM Plex carregadas no root

**Description:** Carregar Plex Sans (400/500/600) e Plex Mono (400/500) e só esconder o splash
quando estiverem prontas — senão a primeira tela aparece com a fonte do sistema e "pula".

**Acceptance criteria:**
- [ ] `@expo-google-fonts/ibm-plex-sans`, `...-mono` e `@expo/vector-icons` instalados
- [ ] `_layout.tsx` chama `useFonts` e `SplashScreen.hideAsync()` apenas com fontes carregadas
- [ ] Nenhum texto renderiza com fonte de fallback na primeira pintura

**Verification:**
- [ ] Manual: cold start em device real; observar o primeiro frame
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 2
**Files likely touched:** `src/app/_layout.tsx`, `package.json`
**Estimated scope:** S

---

## Task 4: Primitivos de layout

**Description:** `Screen` (gutter 20, safe area, max 640 no web), `Rule` (hairline de 1px com
`StyleSheet.hairlineWidth` no iOS), `Label` (mono 12 caixa alta, tracking +0.08em) e
`SectionHeader` (label + régua que corre até a borda).

**Acceptance criteria:**
- [ ] `Rule` renderiza 1px no iOS e 1 unidade no Android (sem diferença visível entre plataformas)
- [ ] `SectionHeader` nunca recebe ícone decorativo
- [ ] Componentes aceitam `className` via NativeWind sem quebrar as props nativas

**Verification:**
- [ ] `npx tsc --noEmit`
- [ ] Visual: as réguas correm até a borda direita, sem padding residual

**Dependencies:** Task 2
**Files likely touched:** `src/components/ui/screen.tsx`, `rule.tsx`, `label.tsx`, `section-header.tsx`
**Estimated scope:** S

---

## Task 5: Primitivos de dado

**Description:** `Text` tipado por token (nunca `fontSize` solto), `DataRow` (gutter de anotação à
esquerda, conteúdo, valor mono à direita), `Numeral` (56 ou 88, tracking negativo) e `Button` com
os três papéis: primário (âmbar 48px), secundário (`raised`), destrutivo (texto `danger`).

**Acceptance criteria:**
- [ ] `Text` só aceita `type` da escala; cor vem por token, não por hex inline
- [ ] `DataRow` alinha valores à direita em Mono e mantém a régua quando `pressed`
- [ ] `Button` entrega os oito estados do §9, incluindo `loading` (3 barras) e `disabled` com
      contraste ≥ 4.5
- [ ] Nenhum componente usa opacidade para indicar estado

**Verification:**
- [ ] `npx tsc --noEmit`
- [ ] Visual: `Button` primário com `onAccent`, nunca branco sobre âmbar

**Dependencies:** Tasks 3, 4
**Files likely touched:** `src/components/ui/text.tsx`, `data-row.tsx`, `numeral.tsx`, `button.tsx`
**Estimated scope:** M

---

## Task 6: Casca de quatro abas

**Description:** Trocar `NativeTabs` por `Tabs` do `expo-router` com quatro abas (Início, Treinar,
Progresso, Perfil), ícones Feather `home`, `play`, `trending-up`, `user`, ativa em `accent` com
indicador de 2px, sem rótulo de texto.

**Acceptance criteria:**
- [ ] Quatro abas navegando, cada uma com sua rota em `(tabs)/`
- [ ] Aba ativa em `accent` + indicador de 2px; inativa em `textMuted`
- [ ] `accessibilityLabel` em cada aba (ícone sem rótulo visual exige rótulo semântico)
- [ ] Tab bar em `surface`, sem sombra

**Verification:**
- [ ] Manual: navegar pelas quatro abas em iOS e Android
- [ ] `npx tsc --noEmit`

**Dependencies:** Tasks 2, 5
**Files likely touched:** `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/index.tsx`, `train.tsx`,
`progress.tsx`, `profile.tsx`, `src/app/_layout.tsx`
**Estimated scope:** M

---

## Task 7: Remover o template do Expo

**Description:** Apagar o que sobrou do template (`themed-text`, `themed-view`, `hint-row`,
`web-badge`, `animated-icon`, `collapsible`, `use-theme`, telas `index`/`explore` originais). Se
ficar, a próxima tela "reaproveita" e a identidade erode.

**Acceptance criteria:**
- [ ] Nenhum arquivo do template permanece em `src/`
- [ ] Nenhum import de `@/components/themed-*` ou `hint-row` no repositório
- [ ] App compila e as quatro abas abrem

**Verification:**
- [ ] `grep -rn "themed-\|hint-row\|web-badge" src/` vazio
- [ ] `npx tsc --noEmit` e `npx expo lint`

**Dependencies:** Task 6
**Files likely touched:** remoções em `src/components/`, `src/hooks/use-theme.ts`, `src/app/`
**Estimated scope:** M

---

## Task 8: `api/client.ts` com Bearer e erro tipado

**Description:** Um `fetch` wrapper: resolve `EXPO_PUBLIC_API_URL`, injeta `Authorization: Bearer`,
serializa JSON, e converte toda resposta não-2xx no `ErrorResponse` do backend em uma
`ApiError` com `code`, `status`, `errors[]` e `path`.

**Acceptance criteria:**
- [ ] `ApiError` expõe `code` e `fields: {field, message}[]`
- [ ] Resposta não-JSON (502 de proxy) não explode: vira `ApiError` com `code: "NETWORK"` ou
      `"INTERNAL_ERROR"` e mensagem genérica
- [ ] Timeout explícito (AbortController) configurável
- [ ] Nenhum `console.log` de token ou de corpo de requisição

**Verification:**
- [ ] Teste manual: apontar para URL inválida → erro tipado, sem tela branca
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 7
**Files likely touched:** `src/lib/api/client.ts`, `src/lib/api/error.ts`, `.env.example`
**Estimated scope:** M

---

## Task 9: Mapa `code → mensagem PT-BR`

**Description:** O backend tem 17 códigos estáveis (`UNAUTHENTICATED`, `VALIDATION_FAILED`,
`SESSION_ALREADY_ACTIVE`, `TOO_MANY_ATTEMPTS`, `STALE_WRITE`, …). Uma tabela única traduz para
texto do usuário; nenhuma tela escreve mensagem de erro própria.

**Acceptance criteria:**
- [ ] Todo código do `docs/adr/0001-contrato-de-erro.md` tem entrada
- [ ] Código desconhecido cai em mensagem genérica, nunca em texto vazio
- [ ] `VALIDATION_FAILED` usa `errors[].field` para posicionar a mensagem no campo

**Verification:**
- [ ] `npx tsc --noEmit`
- [ ] Teste manual: senha errada, e-mail duplicado, limite de tentativas (429)

**Dependencies:** Task 8
**Files likely touched:** `src/lib/api/error-messages.ts`
**Estimated scope:** S

---

## Task 10: Armazenamento de tokens

**Description:** Refresh token em `expo-secure-store`; access token só em memória (átomo Jotai).
No web, `SecureStore` não existe: a sessão fica apenas em memória e exige login por aba.

**Acceptance criteria:**
- [ ] `expo-secure-store` instalado; nenhum token em `AsyncStorage` ou `localStorage`
- [ ] Átomo `sessionAtom` guarda `accessToken` + perfil + expiração
- [ ] No web, a ausência de storage é tratada, não silenciada com erro
- [ ] `clearSession()` apaga storage e átomo

**Verification:**
- [ ] Manual: matar e reabrir o app → sessão restaurada via refresh
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 8
**Files likely touched:** `src/lib/auth/session.ts`, `src/lib/auth/storage.ts`, `package.json`
**Estimated scope:** M

---

## Task 11: Refresh automático em 401

**Description:** Quando uma requisição volta `401 UNAUTHENTICATED`, o cliente chama
`POST /api/auth/refresh` uma única vez, guarda o novo access token e repete a requisição original.
Se o refresh falhar, encerra a sessão e volta ao login.

**Acceptance criteria:**
- [ ] Um único refresh em voo mesmo com várias requisições paralelas falhando
- [ ] A requisição original é refeita uma vez, não em loop
- [ ] Refresh inválido limpa storage e redireciona para login
- [ ] Erro que não é 401 não dispara refresh

**Verification:**
- [ ] Manual: expirar o token (15 min ou alterar `JWT_EXPIRATION_MS`) e navegar
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 10
**Files likely touched:** `src/lib/api/client.ts`, `src/lib/auth/session.ts`
**Estimated scope:** M

---

## Task 12: Tela de login

**Description:** Primeira tela do produto (modo Persuade, densidade baixa, variância média). Wordmark
`GYMBRO` em Plex SemiBold, dois campos, ação primária âmbar de largura total.

**Acceptance criteria:**
- [ ] E-mail e senha com `keyboardType` correto, `autoComplete` e `secureTextEntry`
- [ ] Erro de credencial exibido abaixo do campo, em `danger`, via `code`
- [ ] Botão com estados: default, pressed, loading (barras, não spinner), disabled
- [ ] 429 mostra o `Retry-After` traduzido em tempo de espera
- [ ] Login bem-sucedido grava a sessão e navega para as abas

**Verification:**
- [ ] Manual contra backend local: sucesso, senha errada, rate limit
- [ ] Visual em 320/390/768: nada quebra
- [ ] `npx tsc --noEmit`

**Dependencies:** Tasks 11, 9
**Files likely touched:** `src/app/(auth)/login.tsx`, `src/app/(auth)/_layout.tsx`
**Estimated scope:** M

---

## Task 13: Tela de registro

**Description:** Segunda peça do Persuade. Mesmo vocabulário visual do login, com validação de
formulário em Zod espelhando `CreateUserDto` (nome, e-mail, senha ≥ 8) e mapeamento de erro por
campo vindo de `errors[]`.

**Acceptance criteria:**
- [ ] Erros de validação do servidor aparecem no campo correspondente
- [ ] E-mail duplicado (`RESOURCE_ALREADY_EXISTS`) aparece no campo de e-mail
- [ ] Registro bem-sucedido leva ao login com o e-mail preenchido
- [ ] Senha nunca é logada nem ecoada em tela

**Verification:**
- [ ] Manual: registro válido, e-mail repetido, senha curta
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 12
**Files likely touched:** `src/app/(auth)/register.tsx`, `src/lib/validation/auth.ts`
**Estimated scope:** M

---

## Task 14: Lista de exercícios

**Description:** Modo Operate/Read: lista densa com régua, busca e paginação (`PageDto`). Cada linha
mostra nome, músculo e a anotação de margem (equipamento ou incremento).

**Acceptance criteria:**
- [ ] Busca com debounce usando o parâmetro de pesquisa do backend
- [ ] Paginação infinita sem duplicar item ao trocar de página
- [ ] Linha tem estados default/pressed; lista tem loading (barras), empty (frase + ação) e erro
- [ ] Nenhum card com sombra como padrão de lista

**Verification:**
- [ ] Manual: buscar e paginar contra o backend
- [ ] `npx tsc --noEmit`

**Dependencies:** Tasks 9, 5
**Files likely touched:** `src/app/exercises/index.tsx`, `src/lib/api/exercises.ts`,
`src/components/exercise-row.tsx`
**Estimated scope:** M

---

## Task 15: Criar e editar exercício em sheet

**Description:** Sheet nativo (raio 16, padding 20) com nome, músculo primário, secundário,
equipamento e incremento. Ação destrutiva é só texto `danger` com confirmação.

**Acceptance criteria:**
- [ ] Sheet abre em 200ms (ease-out) e fecha em 160ms (ease-in)
- [ ] Validação local espelha `CreateExerciseDto`; erro de servidor vai para o campo
- [ ] Arquivar exige confirmação e usa `danger` sem fundo
- [ ] Ao salvar, a lista reflete o item novo/alterado sem refetch completo

**Verification:**
- [ ] Manual: criar, editar, arquivar
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 14
**Files likely touched:** `src/app/exercise/[id].tsx` ou sheet, `src/lib/api/exercises.ts`
**Estimated scope:** M

---

## Task 16: Lista de rotinas

**Description:** Lista das playlists do usuário com nome, contagem de exercícios e volume alvo.
Ações por linha: treinar, editar, clonar, arquivar.

**Acceptance criteria:**
- [ ] Ação principal leva à tela de treino daquela rotina
- [ ] Arquivar remove da lista sem perder histórico
- [ ] Empty state: frase em `caption` + ação em `accent`, sem ilustração
- [ ] Nenhum rótulo de texto na tab bar; navegação por ícone

**Verification:**
- [ ] Manual: criar duas rotinas, clonar uma, arquivar outra
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 5
**Files likely touched:** `src/app/playlists/index.tsx`, `src/lib/api/playlists.ts`
**Estimated scope:** M

---

## Task 17: Detalhe da rotina

**Description:** Cabeçalho com nome em `title1` e metadados na gutter; lista ordenada de exercícios
com séries e faixa de repetições, cada linha separada por régua.

**Acceptance criteria:**
- [ ] Ordem e alvos vêm de `PlaylistDetailDto`, sem reordenar no cliente
- [ ] Cada linha mostra `targetSets × faixa de reps` em Mono alinhado à direita
- [ ] Estados de loading, empty e erro presentes

**Verification:**
- [ ] Manual: abrir uma rotina com 4 exercícios
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 16
**Files likely touched:** `src/app/playlist/[id].tsx`
**Estimated scope:** M

---

## Task 18: Editar itens da rotina

**Description:** Adicionar exercício (busca + alvo), remover e reordenar com persistência em
`PUT /api/playlists/{id}/order` — uma chamada por movimento concluído, não por frame.

**Acceptance criteria:**
- [ ] Reordenar persiste a nova ordem e sobrevive a reabrir a tela
- [ ] Remover item pede confirmação e usa `danger`
- [ ] Falha de rede ao salvar mantém a ordem anterior e mostra erro, sem estado mentiroso
- [ ] Nenhuma animação de layout (`width`/`height`); só `transform`

**Verification:**
- [ ] Manual: reordenar 3 itens, matar o app, reabrir
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 17
**Files likely touched:** `src/app/playlist/[id].tsx`, `src/components/sortable-list.tsx`
**Estimated scope:** M

---

## Task 19: Iniciar e retomar sessão

**Description:** `POST /api/sessions` ao começar e `GET /api/sessions/active` no boot da aba
Treinar. Se já existe sessão aberta, o app retoma em vez de criar outra (o backend responde
`SESSION_ALREADY_ACTIVE`).

**Acceptance criteria:**
- [ ] Sessão ativa é retomada após fechar e reabrir o app
- [ ] Duas tentativas de start não criam duas sessões (trata `SESSION_ALREADY_ACTIVE` retomando)
- [ ] Sem rotina selecionada, o start manda `playlistId` nulo, não string vazia

**Verification:**
- [ ] Manual: iniciar, matar, reabrir, retomar
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 16
**Files likely touched:** `src/app/(tabs)/train.tsx`, `src/lib/api/sessions.ts`, `src/lib/session/active.ts`
**Estimated scope:** M

---

## Task 20: Tela de treino com numeral XL

**Description:** A tela-assinatura. Cabeçalho mono (`SEMANA`, rotina), lista de séries em régua, e
**um único** `numeralXL` de 88px: o peso da série ativa. Fora das abas, sem tab bar, uma mão.

**Acceptance criteria:**
- [ ] Exatamente um `numeralXL` na árvore (verificável por busca no código da tela)
- [ ] Numeral e unidade alinhados pela base: `42,5` em `numeral`, `kg` em `body` `textSecondary`
- [ ] Séries concluídas em `accent`; série ativa em `accentTint`
- [ ] Alvos de toque ≥ 48×48, incluindo `+`/`−` de incremento
- [ ] Nenhum emoji, nenhuma copy motivacional

**Verification:**
- [ ] Visual em 320/390: nada transborda, numeral legível
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 19
**Files likely touched:** `src/app/session/[id].tsx`, `src/components/set-row.tsx`
**Estimated scope:** M

---

## Task 21: Entrada de série com teclado decimal

**Description:** O coração do uso. Teclado decimal com vírgula, incremento de 2,5 kg em ±, `clientLogId`
gerado **uma vez por série** (idempotência em retry) e POST do log.

**Acceptance criteria:**
- [ ] `42,5` é aceito e enviado como `42.5`; `42.5` digitado também é aceito
- [ ] `clientLogId` é estável: retry do mesmo envio não cria série duplicada
- [ ] Falha de rede mantém o valor digitado na tela e oferece retry
- [ ] Teclado cobre o campo? Não: campo sobe acima do teclado (`KeyboardAvoidingView` por plataforma)
- [ ] Troca de dígito do numeral em 180ms, 8px vertical, sem mola

**Verification:**
- [ ] Manual em device Android real (teclado de fabricante diferente)
- [ ] Manual: desligar dados e tentar enviar; religar e reenviar
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 20
**Files likely touched:** `src/app/session/[id].tsx`, `src/components/set-input.tsx`, `src/lib/format/number.ts`
**Estimated scope:** M

---

## Task 22: Concluir ou abandonar sessão

**Description:** `PATCH /api/sessions/{id}` com `status` e notas. Concluir mostra o resumo (volume,
séries, PRs); abandonar é destrutivo e pede confirmação.

**Acceptance criteria:**
- [ ] Concluir sem logs é bloqueado pelo backend (`CONFLICT`) e o app explica o motivo
- [ ] Abandonar exige confirmação em `danger`
- [ ] Após concluir, a sessão sai de "ativa" e o dashboard reflete o novo volume
- [ ] Voltar ao dashboard não mostra a sessão antiga

**Verification:**
- [ ] Manual: concluir com 3 séries; abandonar outra
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 21
**Files likely touched:** `src/app/session/[id].tsx`, `src/lib/api/sessions.ts`
**Estimated scope:** M

---

## Task 23: Badge de PR e volume total

**Description:** `LogDto`/`LogResult` informam PR. O badge entra em 160ms, raio `pill`, sem confete,
com um `impactLight` de haptics. Volume total da sessão em Mono, alinhado à direita.

**Acceptance criteria:**
- [ ] Badge `PR` só aparece no log que é PR, nunca na tela toda
- [ ] Uma vibração por PR, não por render
- [ ] Volume total recalcula a cada série concluída, sem refetch
- [ ] `expo-haptics` é opcional: ausente, o app não quebra

**Verification:**
- [ ] Manual: registrar série que supera o recorde anterior
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 21
**Files likely touched:** `src/components/pr-badge.tsx`, `src/app/session/[id].tsx`
**Estimated scope:** S

---

## Task 24: Estados de rede e erro no treino

**Description:** Online-only foi a decisão; então a falha precisa ser honesta. Erro de rede no meio
do treino: mensagem em `danger`, valor digitado preservado, ação de retry, e nada de spinner
circular.

**Acceptance criteria:**
- [ ] Erro de rede é distinguido de erro de negócio (usa `code`)
- [ ] Série não enviada continua visível como pendente, com ação de reenviar
- [ ] Nenhum estado de loading usa spinner circular (3 barras de `rule`)
- [ ] Nenhuma escrita local persistente: fechar o app perde a série pendente, e a tela avisa isso

**Verification:**
- [ ] Manual: modo avião no meio de uma série
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 21
**Files likely touched:** `src/components/inline-error.tsx`, `src/app/session/[id].tsx`
**Estimated scope:** S

---

## Task 25: Dashboard de progresso

**Description:** `GET /api/dashboard?weeks=12`. Volume por semana, streak, PRs recentes, próximo
treino e variação de peso. Modo Read: densidade alta, movimento mínimo, sem numeral XL.

**Acceptance criteria:**
- [ ] Semanas sem treino aparecem como zero, sem buraco na série
- [ ] Streak e volume conferem com o servidor (que já calcula no fuso do usuário)
- [ ] `timezone` da resposta é exibido como anotação de margem no cabeçalho
- [ ] Estados loading/empty/erro presentes

**Verification:**
- [ ] Manual: comparar com `curl /api/dashboard` do mesmo usuário
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 22
**Files likely touched:** `src/app/(tabs)/progress.tsx`, `src/components/week-bar.tsx`
**Estimated scope:** M

---

## Task 26: Histórico de sessões

**Description:** Lista paginada de `GET /api/sessions` com data, rotina, volume e número de séries.
Cada linha abre o detalhe.

**Acceptance criteria:**
- [ ] Paginação infinita sem duplicar
- [ ] Data exibida no fuso do usuário, com `há 6 d` na gutter quando recente
- [ ] Volume em Mono à direita
- [ ] Empty state com ação de ir treinar

**Verification:**
- [ ] Manual: 20+ sessões, rolar até o fim
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 25
**Files likely touched:** `src/app/(tabs)/progress.tsx` ou `history.tsx`, `src/lib/api/sessions.ts`
**Estimated scope:** M

---

## Task 27: Detalhe de sessão

**Description:** `GET /api/sessions/{id}`: exercícios, séries, cargas, PRs e notas da sessão. Modo
Read puro, régua em tudo.

**Acceptance criteria:**
- [ ] Série com PR é marcada sem alterar a cor do texto principal
- [ ] Notas longas não estouram a medida de 68 caracteres
- [ ] Sessão abandonada é visualmente distinta (sem `accent`)

**Verification:**
- [ ] Manual: abrir sessão concluída e abandonada
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 26
**Files likely touched:** `src/app/session/detail/[id].tsx`
**Estimated scope:** M

---

## Task 28: Estatística por exercício e próximo alvo

**Description:** `GET /api/exercises/{id}/stats` + `GET /api/playlists/{id}/next-targets`: histórico
de carga, melhor e1RM e o alvo que o backend sugere para a próxima sessão.

**Acceptance criteria:**
- [ ] Alvo sugerido aparece antes de começar a série (é o que fecha o ciclo de progressão)
- [ ] Gráfico usa só `accent` e `rule`, sem gradiente
- [ ] e1RM e melhor carga em Mono à direita

**Verification:**
- [ ] Manual: exercício com 6 semanas de histórico
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 27
**Files likely touched:** `src/app/exercise/[id]/stats.tsx`, `src/components/line-chart.tsx`
**Estimated scope:** M

---

## Task 29: Perfil com nome, e-mail e fuso

**Description:** `GET/PUT /api/users/me`. Nome, e-mail, seletor de fuso (lista IANA), versão do app e
logout. `PUT` parcial: só envia o que mudou.

**Acceptance criteria:**
- [ ] Seletor de fuso grava `timezone` válido; valor inválido é impossível pela lista
- [ ] Trocar fuso muda a semana exibida no dashboard
- [ ] Logout chama `POST /api/auth/logout`, limpa storage e volta ao login
- [ ] Nenhum campo de senha nesta tela (não existe endpoint)

**Verification:**
- [ ] Manual: trocar para `Europe/Lisbon` e conferir o dashboard
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 25
**Files likely touched:** `src/app/(tabs)/profile.tsx`, `src/lib/api/users.ts`
**Estimated scope:** M

---

## Task 30: Bioimpedância — lista e tendência

**Description:** `GET /api/bioimpedance`, `GET /api/bioimpedance/trend`, `GET /api/bioimpedance/{id}/history`.
Lista com data e peso, tendência como gráfico de linha.

**Acceptance criteria:**
- [ ] Peso em kg com vírgula decimal, Mono, à direita
- [ ] Tendência sem gradiente e sem preenchimento decorativo
- [ ] Empty state com ação (importar ou registrar)
- [ ] Excluir medição é `danger` com confirmação

**Verification:**
- [ ] Manual: usuário com 3 medições
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 29
**Files likely touched:** `src/app/(tabs)/profile.tsx` ou `bioimpedance.tsx`, `src/lib/api/bioimpedance.ts`
**Estimated scope:** M

---

## Task 31: Exclusão de conta

**Description:** `DELETE /api/users/me`. Ação destrutiva no fim do Perfil, com confirmação explícita
do que se perde (histórico, rotinas, medições) e sem "desfazer".

**Acceptance criteria:**
- [ ] Confirmação nomeia explicitamente o que será apagado, sem eufemismo
- [ ] Só habilita com confirmação digitada ou dupla confirmação
- [ ] Sucesso limpa storage, limpa átomos e volta ao login
- [ ] Erro mantém a sessão e mostra o motivo

**Verification:**
- [ ] Manual: excluir uma conta de teste com dados
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 29
**Files likely touched:** `src/app/(tabs)/profile.tsx`, `src/components/destructive-confirm.tsx`
**Estimated scope:** M

---

## Task 32: Acessibilidade

**Description:** Auditar as telas: `accessibilityLabel` em todo ícone sem rótulo, alvos de 48×48,
ordem de foco, tipo dinâmico sem quebrar layout, e contraste medido (não estimado).

**Acceptance criteria:**
- [ ] VoiceOver/TalkBack anunciam nome de aba, botão de ícone e linha de série com valor
- [ ] Layout não quebra em tamanho de fonte 200%
- [ ] Contraste ≥ 4.5 para corpo e ≥ 3 para UI grande, verificado nos 14 tokens
- [ ] Nenhum texto com `opacity` para "desabilitar" (usa `textMuted` sobre `raised`)

**Verification:**
- [ ] Manual: VoiceOver no iOS e TalkBack no Android
- [ ] `npx expo lint`

**Dependencies:** Tasks 22, 29
**Files likely touched:** telas das fases 1–5
**Estimated scope:** M

---

## Task 33: Auditoria de movimento

**Description:** Revisar todas as animações com `emil-design-eng`: durações da brand §8, só
`transform`/`opacity`, sem mola, e `reduced motion` desligando tudo exceto haptics.

**Acceptance criteria:**
- [ ] Nenhuma animação de `width`, `height`, `top`, `left`
- [ ] `AccessibilityInfo.isReduceMotionEnabled` respeitado em todas as telas com movimento
- [ ] Nenhum overshoot/bounce
- [ ] Entrada de sheet 200ms, saída 160ms, toque 120ms

**Verification:**
- [ ] Manual: ativar reduzir movimento no sistema
- [ ] `npx expo lint`

**Dependencies:** Task 32
**Files likely touched:** `src/app/**`, `src/components/**`
**Estimated scope:** M

---

## Task 34: Alvo web

**Description:** O projeto tem `react-native-web` e o backend já expõe CORS. Fechar: fontes Plex no
web, largura máxima 640, `focus-visible` com `borderStrong`, hover em linha.

**Acceptance criteria:**
- [ ] `npm run web` abre e o conteúdo para em 640px
- [ ] `focus-visible` com contorno 2px `borderStrong`, offset 2px, nunca `outline: none`
- [ ] Hover de linha usa `surface`, mantendo a régua
- [ ] Preflight CORS funciona a partir de `localhost:8081`

**Verification:**
- [ ] Manual: navegar só com teclado no navegador
- [ ] `npx tsc --noEmit`

**Dependencies:** Task 32
**Files likely touched:** `src/global.css`, `src/components/**`, `mobile/app.json`
**Estimated scope:** M

---

## Task 35: Performance de listas e abertura

**Description:** Listas longas (exercícios, histórico) precisam de virtualização; cold start precisa
de splash sem flash e fontes sem re-render.

**Acceptance criteria:**
- [ ] Listas usam componente virtualizado com `keyExtractor` estável
- [ ] 200 itens rolam a 60fps em device mediano
- [ ] Nenhum re-render de tela inteira ao atualizar uma linha
- [ ] Tempo de abertura medido (não estimado) antes e depois

**Verification:**
- [ ] Manual: perfil de performance no dev menu
- [ ] `npx expo lint`

**Dependencies:** Task 32
**Files likely touched:** listas de exercícios, histórico e sessões
**Estimated scope:** M

---

## Task 36: Revisão tela a tela

**Description:** Última passada com o checklist do brand §11 em cada tela, e com a auditoria das
quatro skills. É a task que transforma "funciona" em "parece feito para este produto".

**Acceptance criteria:**
- [ ] Os 11 itens do checklist §11 respondidos para cada tela
- [ ] Toda tela tem no máximo um elemento de destaque
- [ ] Nenhum emoji, nenhuma segunda cor de acento, nenhum gradiente
- [ ] `design-craft` §4 (banimentos) sem violação no diff

**Verification:**
- [ ] Manual: render em 320/390/768 de cada tela
- [ ] `npx tsc --noEmit` e `npx expo lint`

**Dependencies:** Tasks 33, 34, 35
**Files likely touched:** todas as telas
**Estimated scope:** M

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| `NativeTabs` → `Tabs` muda comportamento de navegação nativa | Alto | Task 6 isolada e primeiro no caminho; nada depende dela antes do checkpoint |
| Fonte Plex com nome de peso divergente do pacote | Alto | Task 3 valida com `useFonts` real; falha silenciosa cai para fonte do sistema e é detectada no primeiro frame |
| `SecureStore` inexistente no web | Médio | Task 10 trata explicitamente: sessão só em memória no web |
| Online-only num ambiente de sinal ruim (a premissa do brand) | Alto | Task 24 dedicada a erro de rede no treino; série pendente visível, retry manual |
| Tipos gerados (`schema.d.ts`) não casarem com o uso do cliente | Médio | `api:types` regenera; `tsc` acusa deriva (já provado nas T13/T14 do backend) |
| Teclado decimal do Android sem vírgula | Alto | Task 21 testa em device real, não simulador; parse aceita `.` e `,` |
| `design-mobile-apps` exigir `SLEEK_API_KEY` | Médio | Fallback declarado: `design-craft` conduz a estrutura; skill fica para quando houver chave |
| 88px de numeral em tela de 320px | Médio | Task 20 valida em 320; se não couber, o problema é a escolha de conteúdo, não o token |
| Escopo de bioimpedância puxar o cronograma | Médio | Fase 5 inteira é pós-laço principal; pode ser cortada do MVP sem afetar treino |

## Open Questions

- **Existe `SLEEK_API_KEY`?** Sem ela, a Etapa 2 da rotina por tela é feita pelo `design-craft`.
- **Bioimpedância entra no MVP?** Import de PDF (multipart + job assíncrono) é a maior peça de
  esforço e a de menor uso semanal.
- **Login social (Apple/Google)** entra na Fase 1 ou fica para depois? A loja pode exigir Sign in
  with Apple se houver login de terceiros.
- **Onboarding**: o brand proíbe "três cards iguais de ícone". Existe onboarding no MVP, ou o
  produto abre direto no login e a primeira sessão ensina?
- **Tema claro** continua pós-MVP? Os tokens já estão preparados para duas paletas.

## Parallelization Opportunities

- **Independentes:** Task 2 (tokens) pode correr em paralelo a Task 8 (client) — nenhuma toca a
  outra.
- **Sequenciais obrigatórias:** Fase 0 inteira (primitivos), depois Fase 1 → Fase 3 (o treino
  depende de sessão e de rotina).
- **Paralelizáveis após o laço principal:** Fase 4 (progresso) e Fase 5 (perfil) tocando telas
  diferentes; Fase 6 só depois das duas.
- **Precisa coordenação:** Task 9 (mapa de códigos) é usada por todas as telas de formulário — fecha
  antes da Fase 2.
