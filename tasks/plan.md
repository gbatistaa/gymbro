# Implementation Plan: telas do PWA Gymbro

## Overview

Construir a casca autenticada e as telas do PWA `web/` (Next.js 16, App Router) consumindo a API
existente do `backend/` (Spring Boot 4), seguindo `docs/brand-identity.md` e o mapa de telas de
`docs/screens.md`.

O trabalho começa no backend porque quatro decisões do usuário mudaram contrato ou schema. Sem elas
as telas não existem: login por e-mail **ou** username, troca de senha, ordenação/lista de músculos
no endpoint de exercícios e volume por músculo no Progresso. Depois vem a casca autenticada e, na
sequência, as telas na ordem de valor.

Plano irmão: `backend/tasks/api-mobile/plan.md` (API pronta para o mobile). Este plano **não o
substitui** e não toca nos arquivos daquela pasta.

## Decisões de produto já fechadas

1. **Histórico** de sessões fica na aba **Progresso**, não em Treinar.
2. O endpoint de exercícios aceita **filtro, ordenação e paginação**; o que faltar, implementa no
   backend. Filtro por músculo precisa de uma fonte de músculos.
3. **Volume por músculo** entra no Progresso já na v1.
4. **Troca de senha** entra no Perfil, junto com `username` (migration nova) e login por e-mail **ou**
   username no mesmo campo.

## Architecture Decisions

- **Casca autenticada é client-side.** Os cookies são `HttpOnly` e a API vive em outra origem
  (`:8080`); renderizar dados privados no servidor exigiria encaminhar cookie de origem cruzada e
  contradiz a regra do `AGENTS.md` de validar a sessão antes de renderizar. A guarda chama
  `GET /api/users/me` ao montar, mostra estado neutro e só então renderiza.
- **Nenhuma biblioteca de data fetching.** Um hook `useResource<T>()` cobre `loading | error | data`
  e `reload()`. React Query não entra sem necessidade comprovada.
- **Rotas em `(app)`**, route group para não mudar URL. `/` passa a ser `(app)/page.tsx`; o
  `app/page.tsx` placeholder precisa ser **removido**, senão duas páginas resolvem `/` e o build
  quebra.
- **CSS Modules + tokens existentes.** Nada de Tailwind/shadcn. Reaproveitar `globals.css` e o padrão
  de `features/auth/components/auth.module.css`.
- **Contratos Zod em `web/src/contracts/`** por domínio, com tipos inferidos. Nenhum cast.
- **Valores em mono, alinhados à direita**, com `Intl.NumberFormat("pt-BR")` e vírgula decimal. O
  único `numeralXL` do app é a carga da sessão ao vivo.
- **`clientLogId` é gerado no cliente antes do POST** (`crypto.randomUUID()`), aproveitando a
  idempotência já existente no backend.
- **204 é um caso de contrato**, não de erro: `requestMaybe()` em `lib/http.ts` devolve `null`.
- **Troca de senha nunca responde 401.** O interceptor de `lib/http.ts` trata 401 em `/api/**`
  (fora de `/api/auth/*`) como sessão expirada e desloga; senha atual incorreta será `400` com
  `code` próprio.

---

## Task List

### Fase 1 — Backend habilitando as telas

- [x] Task 1: Migration `users.username` com backfill e unicidade
- [x] Task 2: `username` no domínio, nos DTOs e no cadastro
- [x] Task 3: Login por e-mail ou username
- [x] Task 4: `PUT /api/users/me/password`
- [x] Task 5: Ordenação e lista de músculos em exercícios
- [x] Task 6: Resumo de rotina na listagem (`exerciseCount`, `lastPerformedAt`)
- [x] Task 7: `GET /api/dashboard/muscle-volume`
- [x] Task 8: Fuso do usuário nos buckets mensais por exercício
- [x] Task 9: Atualizar snapshot OpenAPI

**Checkpoint Fase 1**

- [x] `cd backend && ./mvnw test` verde
- [x] `docs/api/openapi.json` regenerado com os novos campos e rotas
- [x] Login com e-mail e com username devolvem 200 (coberto por `AuthFlowIT`)

### Fase 2 — Fundação do frontend

- [ ] Task 10: Contratos Zod dos domínios
- [ ] Task 11: `requestMaybe` + `useResource`
- [ ] Task 12: `lib/format.ts` (PT-BR, kg, duração, datas relativas)
- [ ] Task 13: Primitivos em `components/ui/`
- [ ] Task 14: Casca autenticada, barra inferior e guard de sessão
- [ ] Task 15: Atualizar signin/signup para username e identificador

**Checkpoint Fase 2**

- [ ] `cd web && pnpm lint && pnpm typecheck && pnpm build`
- [ ] `/signup` cria conta com username; `/signin` entra com e-mail e com username
- [ ] Rota privada sem sessão redireciona para `/signin?next=`; com sessão não mostra flash de conteúdo privado

### Fase 3 — Início

- [ ] Task 16: Tela Início com dados do dashboard

**Checkpoint Fase 3**

- [ ] Início mostra sessão ativa, próximo treino, números da semana, volume e PRs
- [ ] Estados vazio/erro/loading implementados

### Fase 4 — Treinar

- [ ] Task 17: Lista de rotinas
- [ ] Task 18: Editor de rotina

**Checkpoint Fase 4**

- [ ] Criar, abrir, duplicar, arquivar e iniciar rotina funcionam
- [ ] Reordenar exercícios persiste após recarregar

### Fase 5 — Sessão ao vivo

- [ ] Task 19: Sessão ao vivo

**Checkpoint Fase 5**

- [ ] Registrar 3 séries, ver PR, finalizar; volume reflete no Início
- [ ] Reenviar a mesma série (retry) não duplica

### Fase 6 — Progresso

- [ ] Task 20: Histórico de sessões
- [ ] Task 21: Detalhe de sessão concluída
- [ ] Task 22: Visão geral de Progresso
- [ ] Task 23: Estatísticas de exercício
- [ ] Task 24: Corpo / bioimpedância
- [ ] Task 25: Nova medição e importação de PDF

**Checkpoint Fase 6**

- [ ] Histórico pagina e filtra por período
- [ ] Tendência de peso mostra delta e média móvel
- [ ] Import de PDF chega à tela de revisão e confirma

### Fase 7 — Perfil

- [ ] Task 26: Perfil, troca de senha, logout e exclusão

### Fase 8 — PWA e fechamento

- [ ] Task 27: Manifest, ícone e service worker mínimo
- [ ] Task 28: Revisão de acessibilidade e contraste

**Checkpoint Final**

- [ ] `cd web && pnpm lint && pnpm typecheck && pnpm build`
- [ ] `cd backend && ./mvnw test`
- [ ] Checklist do §11 do `brand-identity.md` aplicado a cada tela

---

## Task 1: Migration `users.username` com backfill e unicidade

**Description:** Adicionar `username` a `users` sem quebrar contas existentes. A coluna nasce
anulável, é preenchida a partir da parte local do e-mail (sanitizada), resolve colisões com sufixo
numérico, e só então recebe `NOT NULL` e índice único por `lower(username)`.

**Acceptance criteria:**

- [x] `V12__users_username.sql` com `-- author: jacob`, no padrão das migrations existentes
- [x] Usuário `joao.silva@x.com` sem colisão vira `joao.silva`
- [x] Duas contas com a mesma parte local terminam com sufixos distintos (`joao.silva`, `joao.silva2`)
- [x] Username resultante casa `^[a-z0-9_]([a-z0-9_.]*[a-z0-9_])?$` e tem 3–30 caracteres
- [x] `NOT NULL` aplicado depois do backfill; índice único `lower(username)`
- [x] Migration roda duas vezes sem erro em base já migrada (Flyway controla; assert de idempotência
      do backfill por `WHERE username IS NULL`)

**Verification:**

- [x] Tests pass: `./mvnw -Dtest=UsernameMigrationIT test` e `./mvnw test` (163 testes)
- [x] Build succeeds: `./mvnw test`
- [x] Manual: coberto por asserção em `information_schema`/`pg_indexes` no `UsernameMigrationIT`

**Dependencies:** None
**Files likely touched:**

- `src/main/resources/db/migration/V12__users_username.sql` (novo)

**Estimated scope:** S

---

## Task 2: `username` no domínio, nos DTOs e no cadastro

**Description:** Expor `username` onde a API já expõe `email`: entidade, `UserDto`,
`UserSummaryProjection`, mapper e `CreateUserDto`. Cadastro passa a exigir username com validação e
conflito próprio.

**Acceptance criteria:**

- [x] `User.username` mapeado, `NOT NULL`
- [x] `CreateUserDto` recebe `username` com `@NotBlank`, `@Size(3–30)` e `@Pattern` (letras, dígitos,
      `_`, `.`); o service normaliza para minúsculas
- [x] Username duplicado → `409 RESOURCE_ALREADY_EXISTS` com mensagem distinta do e-mail e
      `errors:[{field:"username"}]`
- [x] `UserDto` e `UserSummaryProjection` devolvem `username`
- [x] `POST /api/auth/register` com três campos inválidos devolve três itens em `errors[]`

**Verification:**

- [x] Tests pass: `./mvnw -Dtest=UserServiceTest,UserControllerTest,AuthControllerTest test`
- [x] Build succeeds: `./mvnw test` (166 testes)
- [x] `POST /api/auth/register` sem username → `400 VALIDATION_FAILED` (teste `shouldRejectMissingUsername`)

**Dependencies:** Task 1
**Files likely touched:**

- `user/User.java`, `user/dto/CreateUserDto.java`, `user/dto/UserDto.java`,
  `user/UserSummaryProjection.java`, `user/UserMapper.java`, `user/UserService.java`,
  `user/UserRepository.java`
- testes: `UserServiceTest`, `UserControllerTest`, `AuthControllerTest` (+ `UserSamples` novo, se
  houver mock de `User`)

**Estimated scope:** M

---

## Task 3: Login por e-mail ou username

**Description:** `POST /api/auth/login` passa a aceitar um identificador único no lugar de `email`.
A resolução é uma consulta só: `lower(email) = lower(:identifier) OR lower(username) =
lower(:identifier)`.

**Acceptance criteria:**

- [x] `LoginDto` vira `{ identifier, password }`, com `@NotBlank` e `@Size(max 254)`
- [x] Login com e-mail cadastrado → `200` e cookies
- [x] Login com username cadastrado (qualquer caixa) → `200` e cookies
- [x] Identificador inexistente e senha errada devolvem o mesmo `401 UNAUTHENTICATED`
- [x] Rate limiter mantém a chave por IP + identificador normalizado em minúsculas

**Verification:**

- [x] Tests pass: `./mvnw -Dtest=AuthControllerTest,AuthFlowIT test` (27 testes)
- [x] Build succeeds: `./mvnw test` (170 testes)
- [x] Manual: coberto por `AuthFlowIT.loginAcceptsEmailOrUsername` (e-mail e username em caixa alta)

**Dependencies:** Task 2
**Files likely touched:**

- `auth/dto/LoginDto.java`, `auth/AuthService.java`, `auth/LoginRateLimiter.java`,
  `user/UserRepository.java`
- testes: `AuthControllerTest`, `AuthFlowIT`

**Estimated scope:** S

---

## Task 4: `PUT /api/users/me/password`

**Description:** Permitir troca de senha autenticada. Valida a senha atual, grava o novo hash e
revoga todas as sessões do usuário — o cliente precisa entrar novamente.

**Acceptance criteria:**

- [x] `PUT /api/users/me/password` com `{ currentPassword, newPassword }` → `204`
- [x] Senha atual incorreta → `400 INVALID_CURRENT_PASSWORD` (**nunca 401**, para não disparar o
      refresh/deslogar no interceptor do PWA)
- [x] `newPassword` com menos de 8 caracteres → `400 VALIDATION_FAILED` com `errors[]`
- [x] Todas as linhas de `refresh_tokens` do usuário removidas após sucesso
- [x] Sem autenticação → `401 UNAUTHENTICATED`

**Verification:**

- [x] Tests pass: `./mvnw -Dtest=UserServiceTest,UserControllerTest test`
- [x] Build succeeds: `./mvnw test` (176 testes)
- [x] Manual: coberto por `UserControllerTest.shouldChangePasswordAndRevokeSessions` (login com a
      antiga falha, com a nova passa, refresh antigo devolve 401)

**Dependencies:** Task 3
**Files likely touched:**

- `user/dto/UpdatePasswordRequest.java` (novo), `user/UserController.java`, `user/UserService.java`,
  `user/RefreshTokenRepository.java`, `errors/GlobalExceptionHandler.java` (mapear o novo code)
- testes: `UserControllerTest`, `UserServiceTest`

**Estimated scope:** M

---

## Task 5: Ordenação e lista de músculos em exercícios

**Description:** `GET /api/exercises` ganha `sort` com whitelist e `GET /api/exercises/muscles`
devolve os músculos primários distintos visíveis ao usuário, para alimentar o filtro da biblioteca.

**Acceptance criteria:**

- [x] `sort` aceita `name`, `createdAt`, `incrementKg`, com prefixo `-` para descendente
- [x] Valor inválido de `sort` → `400 VALIDATION_FAILED` via `InvalidSortException`
- [x] Default continua `name` ascendente; `page`/`size`/`q`/`muscle` inalterados
- [x] `GET /api/exercises/muscles` devolve lista ordenada, sem duplicata por caixa, restrita ao
      catálogo global + exercícios do usuário
- [x] Nenhum nome de coluna vindo do cliente chega ao SQL (whitelist + `Sort` tipado; `ORDER BY`
      fixo removido do `searchForUser`)

**Verification:**

- [x] Tests pass: `./mvnw -Dtest=ExerciseServiceTest,ExerciseOwnershipIT test` (20 testes)
- [x] Build succeeds: `./mvnw test` (181 testes)
- [x] Manual: coberto por `ExerciseOwnershipIT.shouldSortExercises` e `shouldListDistinctMuscles`

**Dependencies:** None (paralelizável com Tasks 2–4)
**Files likely touched:**

- `exercise/ExerciseController.java`, `exercise/ExerciseService.java`,
  `exercise/ExerciseRepository.java`
- testes: `ExerciseServiceTest`, `ExerciseOwnershipIT`

**Estimated scope:** S

---

## Task 6: Resumo de rotina na listagem

**Description:** A aba Treinar precisa de contagem de exercícios e da última execução sem fazer N+1
no cliente. `GET /api/playlists` passa a devolver um DTO de resumo com esses dois campos.

**Acceptance criteria:**

- [x] `PlaylistSummaryDto { id, name, description, archivedAt, exerciseCount, lastPerformedAt }`
- [x] `GET /api/playlists` devolve o resumo; `GET /{id}` continua com `PlaylistDetailDto`
- [x] Rotina nunca executada devolve `lastPerformedAt: null` e `exerciseCount: 0`
- [x] Uma query agregada por listagem, sem laço por rotina
- [x] `POST`/`PUT`/`clone`/`archive` continuam devolvendo `PlaylistDto` (sem quebra de contrato)

**Verification:**

- [x] Tests pass: `./mvnw -Dtest=PlaylistServiceTest,PlaylistFlowIT test` (20 testes)
- [x] Build succeeds: `./mvnw test` (182 testes)
- [x] IT cobre contagem, rotina vazia, última sessão FINISHED, ignora IN_PROGRESS/ABANDONED e escopo por usuário

**Dependencies:** None
**Files likely touched:**

- `playlist/dto/PlaylistSummaryDto.java` (novo), `playlist/PlaylistController.java`,
  `playlist/PlaylistService.java`, `playlist/PlaylistRepository.java`
- testes: `PlaylistServiceTest`, `PlaylistFlowIT`

**Estimated scope:** S

---

## Task 7: `GET /api/dashboard/muscle-volume`

**Description:** Volume por grupo muscular no período, para o Progresso. Endpoint próprio em vez de N
chamadas no cliente ou de custo extra no dashboard do Início.

**Acceptance criteria:**

- [x] `GET /api/dashboard/muscle-volume?from&to` → `[{ muscle, volume, sets }]`
- [x] Sem `from`/`to`, usa as últimas 12 semanas de calendário no fuso do usuário
- [x] Só sessões `FINISHED` entram no cálculo
- [x] Agrupa por músculo primário normalizado (sem duplicar por caixa); ordena por volume desc
- [x] Usuário sem sessões devolve lista vazia, não 404

**Verification:**

- [x] Tests pass: `./mvnw -Dtest=DashboardServiceTest,AnalyticsFlowIT test` (10 testes)
- [x] Build succeeds: `./mvnw test` (184 testes)
- [x] IT cobre sessão finalizada, estados excluídos, intervalo, normalização, ordenação, isolamento e vazio

**Dependencies:** None
**Files likely touched:**

- `analytics/DashboardController.java`, `analytics/DashboardService.java`,
  `analytics/dto/MuscleVolumeDto.java` (novo), `workout_logs/WorkoutLogRepository.java`
- testes: `DashboardServiceTest`, `AnalyticsFlowIT`

**Estimated scope:** M

---

## Task 8: Fuso do usuário nos buckets mensais por exercício

**Description:** Corrigir o item aberto `Task 12b`: `monthlyExerciseBuckets` usa
`'America/Sao_Paulo'` fixo no SQL nativo, enquanto o resto respeita `users.timezone`.

**Acceptance criteria:**

- [x] A query recebe o `ZoneId` do usuário por parâmetro
- [x] Mesma sessão cai em meses diferentes para `America/Sao_Paulo` e `Asia/Tokyo`
- [x] `ExerciseStatsService` continua devolvendo `MonthlyBucketDto` com o mesmo shape
- [x] Nenhum literal de fuso permanece no repositório

**Verification:**

- [x] Tests pass: `./mvnw -Dtest=ExerciseStatsServiceTest,AnalyticsFlowIT test` (9 testes)
- [x] Build succeeds: `./mvnw test` (186 testes)

**Dependencies:** None
**Files likely touched:**

- `workout_logs/WorkoutLogRepository.java`, `analytics/ExerciseStatsService.java`
- testes: `ExerciseStatsServiceTest`, `AnalyticsFlowIT`

**Estimated scope:** S

---

## Task 9: Atualizar snapshot OpenAPI

**Description:** Regenerar `docs/api/openapi.json` após as mudanças de contrato e conferir que o
snapshot reflete login por identificador, troca de senha, resumo de playlist, músculos e volume por
músculo.

**Acceptance criteria:**

- [x] `OpenApiContractIT` passa e reescreve `docs/api/openapi.json`
- [x] Snapshot contém `LoginDto.identifier`, `PUT /api/users/me/password`,
      `GET /api/exercises/muscles`, `GET /api/dashboard/muscle-volume`, `username` em `UserDto`
      — fixado por asserção no `OpenApiContractIT`
- [x] Nenhuma rota ou campo removido sem intenção (diff contra HEAD vazio)
- [x] Diff do snapshot revisado linha a linha

**Verification:**

- [x] Tests pass: `./mvnw -Dtest=OpenApiContractIT test`
- [x] Build succeeds: `./mvnw test` (186 testes)
- [x] `git diff docs/api/openapi.json` sem remoções; 34 rotas publicadas

**Dependencies:** Tasks 1–8
**Files likely touched:**

- `docs/api/openapi.json`, `src/test/java/com/gbatistadev/gymbro/OpenApiContractIT.java` (se o
  snapshot precisar de ajuste de nome de arquivo)

**Estimated scope:** XS

---

## Task 10: Contratos Zod dos domínios

**Description:** Schemas de runtime para cada resposta da API que as telas consomem, com tipos
inferidos. Nada de tipo duplicado à mão.

**Acceptance criteria:**

- [ ] `contracts/auth.ts` atualizado: `userSummarySchema` com `username`, `loginSchema` com
      `identifier`, `signUpSchema` com `username`
- [ ] Novos: `contracts/page.ts` (genérico), `exercise.ts`, `playlist.ts`, `session.ts`,
      `analytics.ts`, `bioimpedance.ts`
- [ ] `sessionStatusSchema` cobre `IN_PROGRESS | FINISHED | ABANDONED`
- [ ] Campos anuláveis do backend são `nullish()`/`nullable()`, nunca `optional()` disfarçado
- [ ] Datas usam `z.iso.datetime({ offset: true })`, como no contrato existente
- [ ] Nenhum `as` para contornar schema

**Verification:**

- [ ] Build succeeds: `cd web && pnpm typecheck`
- [ ] Manual: cada endpoint usado por uma tela tem schema correspondente

**Dependencies:** Task 9
**Files likely touched:**

- `web/src/contracts/auth.ts` e novos arquivos em `web/src/contracts/`

**Estimated scope:** M

---

## Task 11: `requestMaybe` + `useResource`

**Description:** Dois utilitários que todas as telas vão usar: tratar `204` como ausência de dado e
padronizar `loading | error | data | reload` sem repetir 20 linhas por tela.

**Acceptance criteria:**

- [ ] `requestMaybe(config, schema)` devolve `T | null` e trata `204`/corpo vazio
- [ ] `useResource(loader, deps)` devolve `{ data, error, isLoading, reload }` e ignora resposta de
      chamada obsoleta após unmount
- [ ] Erro de rede vira mensagem PT-BR acionável, reutilizando `apiErrorSchema`
- [ ] Nenhuma chamada Axios nova fora de `lib/http.ts`

**Verification:**

- [ ] Build succeeds: `cd web && pnpm lint && pnpm typecheck`
- [ ] Manual: `GET /api/sessions/active` sem sessão ativa devolve `null` e a tela mostra estado vazio

**Dependencies:** Task 10
**Files likely touched:**

- `web/src/lib/http.ts`, `web/src/lib/use-resource.ts` (novo), `web/src/lib/api-error-text.ts` (novo)

**Estimated scope:** S

---

## Task 12: `lib/format.ts`

**Description:** Formatação única de números, cargas, datas e durações em PT-BR, para que nenhuma
tela invente o próprio separador decimal.

**Acceptance criteria:**

- [ ] `formatKg(42.5)` → `42,5`; milhar com ponto (`12.480`)
- [ ] `formatVolume` com unidade `kg` e `formatPercent` com vírgula
- [ ] `formatDate`/`formatDateTime` no fuso do usuário (`Intl` com `timeZone` explícito)
- [ ] `formatDuration` em `1h 12min` / `48min`
- [ ] `formatRelative` em `há 6 d`, `hoje`, `ontem`
- [ ] Nenhuma função devolve `-0` ou `NaN` para entrada nula (retorna `—`)

**Verification:**

- [ ] Build succeeds: `pnpm typecheck`
- [ ] Manual: conferir `42,5`, `12.480 kg`, `há 6 d` na tela de teste do Início

**Dependencies:** None
**Files likely touched:**

- `web/src/lib/format.ts` (novo)

**Estimated scope:** S

---

## Task 13: Primitivos em `components/ui/`

**Description:** Primitivos visuais do caderno de treino, para as telas não recriarem régua, linha de
dado e botão com estilos divergentes.

**Acceptance criteria:**

- [ ] `SectionLabel` (mono, caixa alta, régua até a borda do conteúdo)
- [ ] `DataRow` (linha com valor mono alinhado à direita, régua, gutter de anotação)
- [ ] `Button` com variantes `primary` (verde/`onAccent`), `secondary` (`raised`), `ghost`,
      `danger`; altura mínima 48px, foco visível, `aria-busy` quando carregando
- [ ] `Field` com label persistente, erro associado por `aria-describedby`, `aria-invalid`
- [ ] `EmptyState`, `ErrorState` (com `retry`), `Skeleton`, `Notice` (info/erro/sucesso)
- [ ] `ConfirmDialog` para ações destrutivas, com foco inicial no cancelar e `Esc` fechando
- [ ] Nenhuma cor literal: só tokens de `globals.css`
- [ ] Estados de hover/pressed/focus/disabled/loading implementados nos componentes interativos

**Verification:**

- [ ] Build succeeds: `pnpm lint && pnpm typecheck && pnpm build`
- [ ] Manual: Tab percorre todos os controles; foco visível; contraste conferido nos pares reais

**Dependencies:** Task 12
**Files likely touched:**

- `web/src/components/ui/*.tsx` + `ui.module.css` (novos)

**Estimated scope:** M

---

## Task 14: Casca autenticada, barra inferior e guard de sessão

**Description:** O contêiner de todas as telas privadas: valida a sessão, hidrata o usuário, navega
entre as quatro abas e reserva espaço para a barra inferior.

**Acceptance criteria:**

- [ ] `web/src/app/(app)/layout.tsx` com shell; `web/src/app/page.tsx` placeholder **removido**
- [ ] Guard chama `GET /api/users/me` ao montar; enquanto pendente mostra carregamento neutro, sem
      conteúdo privado
- [ ] Falha na validação → `/signin?next=<rota atual>` e `sessionAtom` limpo
- [ ] `sessionAtom` reidratado com o usuário validado; formato antigo `{ tokens, user }` é descartado
- [ ] Barra inferior: Início, Treinar, Progresso, Perfil; ícone + rótulo; `aria-current="page"`;
      alvo ≥48×48; `padding-bottom: env(safe-area-inset-bottom)`
- [ ] Conteúdo tem `padding-bottom` suficiente para a barra; `position: fixed` no topo usa
      `top: var(--safe-area-top)`
- [ ] Em ≥768px a navegação vira barra lateral sem perder destinos nem rótulos
- [ ] Deep link e recarregamento preservam a rota

**Verification:**

- [ ] Build succeeds: `pnpm lint && pnpm typecheck && pnpm build`
- [ ] Manual: abrir `/train` sem sessão → `/signin?next=/train`; após login volta a `/train`
- [ ] Manual: 320px sem rolagem horizontal; barra não encobre conteúdo

**Dependencies:** Tasks 10, 11, 13
**Files likely touched:**

- `web/src/app/(app)/layout.tsx` (novo), `web/src/features/shell/app-shell.tsx` (novo),
  `web/src/features/shell/bottom-nav.tsx` (novo), `web/src/features/shell/session-guard.tsx` (novo),
  `web/src/features/shell/shell.module.css` (novo)
- `web/src/app/page.tsx` (remover)

**Estimated scope:** M

---

## Task 15: Atualizar signin/signup para username e identificador

**Description:** Ajustar as telas existentes ao novo contrato: login por identificador e cadastro com
username.

**Acceptance criteria:**

- [ ] Signin: label "E-mail ou usuário", `type="text"`, `autoComplete="username"`
- [ ] Signup: campo username com dica de formato e mensagem PT-BR
- [ ] Erro de username duplicado aparece no campo, não só como aviso geral
- [ ] `?next=` continua preservado ao alternar entre as telas
- [ ] Nenhum token no `localStorage`; `sessionAtom` segue só com `{ user }`

**Verification:**

- [ ] Build succeeds: `pnpm lint && pnpm typecheck && pnpm build`
- [ ] Manual: login por e-mail e por username; cadastro com username repetido mostra erro no campo

**Dependencies:** Tasks 10, 14
**Files likely touched:**

- `web/src/features/auth/sign-in-form.tsx`, `web/src/features/auth/sign-up-form.tsx`,
  `web/src/features/auth/errors.ts`, `web/src/contracts/auth.ts`

**Estimated scope:** S

---

## Task 16: Tela Início com dados do dashboard

**Description:** Substituir o placeholder por uma tela que responde "o que eu faço agora": sessão em
andamento, próximo treino, números da semana, volume semanal e PRs recentes.

**Acceptance criteria:**

- [ ] `GET /api/sessions/active` e `GET /api/dashboard` consumidos via `useResource`
- [ ] Bloco de sessão ativa (quando existe) com rotina, tempo decorrido, volume e *Continuar*
- [ ] Próximo treino com nome da rotina e alvo do primeiro exercício (`next-targets`), CTA *Iniciar*
- [ ] Faixa de números (sessões, volume, streak, delta de peso) em `DataRow`, não em cards
- [ ] Mini-barras das últimas 12 semanas sem eixo decorativo
- [ ] PRs recentes em lista mono com `formatRelative`
- [ ] Estados: sem rotina (CTA criar), sem dados, erro com retry
- [ ] Um único CTA primário verde na tela

**Verification:**

- [ ] Build succeeds: `pnpm lint && pnpm typecheck && pnpm build`
- [ ] Manual: conta nova mostra vazio com ação; conta com histórico mostra os cinco blocos

**Dependencies:** Task 14
**Files likely touched:**

- `web/src/app/(app)/page.tsx` (novo), `web/src/features/home/home-screen.tsx` (novo),
  `web/src/features/home/weekly-bars.tsx` (novo), `web/src/features/home/home.module.css` (novo)

**Estimated scope:** M

---

## Task 17: Lista de rotinas

**Description:** Aba Treinar com as rotinas do usuário, resumo de cada uma e ações rápidas.

**Acceptance criteria:**

- [ ] `GET /api/playlists?includeArchived=` com contagem e última execução (Task 6)
- [ ] Ações: iniciar, duplicar, arquivar (com confirmação), toggle de arquivadas
- [ ] *Nova rotina* cria via `POST` e abre o editor
- [ ] `409 SESSION_ALREADY_ACTIVE` ao iniciar é tratado: oferece *Continuar sessão ativa*
- [ ] Estados: lista vazia, erro, loading
- [ ] Atalho para biblioteca de exercícios com rótulo visível

**Verification:**

- [ ] Build succeeds: `pnpm lint && pnpm typecheck && pnpm build`
- [ ] Manual: criar rotina vazia, duplicar, arquivar e reexibir

**Dependencies:** Task 14
**Files likely touched:**

- `web/src/app/(app)/train/page.tsx`, `web/src/features/train/playlist-list.tsx`,
  `web/src/features/train/new-playlist-form.tsx`, `web/src/features/train/train.module.css`

**Estimated scope:** M

---

## Task 18: Editor de rotina

**Description:** Editar a rotina: exercícios ordenáveis, séries/reps/descanso e a sugestão de
progressão visível junto do item.

**Acceptance criteria:**

- [ ] `GET /api/playlists/{id}` + `GET /{id}/next-targets` renderizam itens com
      `3 × 8–12`, `90 s` e sugestão
- [ ] Reordenar persiste via `PUT /{id}/order` e sobrevive a recarregar
- [ ] Adicionar exercício busca em `GET /api/exercises?q=` e envia `POST /{id}/exercises`
- [ ] Editar alvos via `PATCH`, remover item via `DELETE` com confirmação
- [ ] Validação espelhada: `targetSets` 1–20, `restSeconds` 0–600, nome ≤ 120
- [ ] Exercício arquivado aparece marcado, não quebra a tela
- [ ] Estados: rotina vazia com CTA, erro de conflito, loading

**Verification:**

- [ ] Build succeeds: `pnpm lint && pnpm typecheck && pnpm build`
- [ ] Manual: adicionar 3 exercícios, reordenar, recarregar e conferir a ordem

**Dependencies:** Tasks 17
**Files likely touched:**

- `web/src/app/(app)/train/playlists/[id]/page.tsx`,
  `web/src/features/train/playlist-editor.tsx`,
  `web/src/features/train/exercise-picker.tsx`,
  `web/src/features/train/playlist-item-form.tsx`

**Estimated scope:** L

---

## Task 19: Sessão ao vivo

**Description:** A tela-assinatura: um numeral, uma ação. Registrar série com idempotência, ver
séries concluídas e PR, controlar descanso e encerrar a sessão.

**Acceptance criteria:**

- [ ] Carga e reps editáveis com stepper respeitando `incrementKg` e entrada numérica
- [ ] `clientLogId` gerado antes do `POST`; retry com o mesmo id não duplica série
- [ ] Série enviada aparece na lista com régua; PR sinalizado com texto além da cor
- [ ] Navegação entre exercícios com alvo do `next-targets` ao lado
- [ ] Timer de descanso discreto usando `restSeconds`, sem modal e respeitando
      `prefers-reduced-motion`
- [ ] *Finalizar* (`PATCH FINISHED`) e *Abandonar* (`PATCH ABANDONED`, com confirmação)
- [ ] Falha de rede mantém a série pendente e permite reenviar; `409` de sessão encerrada
      redireciona para o detalhe
- [ ] Um único `numeralXL` por tela

**Verification:**

- [ ] Build succeeds: `pnpm lint && pnpm typecheck && pnpm build`
- [ ] Manual: registrar 3 séries, finalizar e conferir volume no Início
- [ ] Manual: desligar a rede, enviar série, religar e reenviar — sem duplicata

**Dependencies:** Tasks 13, 14, 18
**Files likely touched:**

- `web/src/app/(app)/train/sessions/[id]/page.tsx`,
  `web/src/features/session/live-session.tsx`,
  `web/src/features/session/set-input.tsx`,
  `web/src/features/session/rest-timer.tsx`,
  `web/src/features/session/session.module.css`

**Estimated scope:** L

---

## Task 20: Histórico de sessões

**Description:** Histórico dentro de Progresso, agrupado por semana, com filtro de período e
paginação.

**Acceptance criteria:**

- [ ] `GET /api/sessions?from&to&page&size` com grupos por semana no fuso do usuário
- [ ] Linha: data, rotina, volume, duração, séries, marcador de PR
- [ ] Filtro 4 semanas / 12 semanas / período personalizado
- [ ] *Carregar mais* respeita `totalPages`; fim da lista é explícito
- [ ] Toque abre o detalhe; estados vazio/erro/loading

**Verification:**

- [ ] Build succeeds: `pnpm lint && pnpm typecheck && pnpm build`
- [ ] Manual: paginar até o fim em conta com >20 sessões

**Dependencies:** Task 14
**Files likely touched:**

- `web/src/app/(app)/progress/history/page.tsx`,
  `web/src/features/progress/session-history.tsx`,
  `web/src/features/progress/period-filter.tsx`

**Estimated scope:** M

---

## Task 21: Detalhe de sessão concluída

**Description:** Leitura da sessão: volume, duração, séries por exercício, PRs e notas.

**Acceptance criteria:**

- [ ] `GET /api/sessions/{id}` renderiza exercícios agrupados com séries em réguas
- [ ] PRs destacados com badge textual
- [ ] Sessão `IN_PROGRESS` redireciona para a tela ao vivo
- [ ] Sessão inexistente/404 mostra estado de erro, não tela em branco
- [ ] *Repetir esta rotina* disponível quando a sessão tem `playlistId`

**Verification:**

- [ ] Build succeeds: `pnpm lint && pnpm typecheck && pnpm build`
- [ ] Manual: abrir sessão com PR e uma sem PR

**Dependencies:** Task 20
**Files likely touched:**

- `web/src/app/(app)/train/sessions/[id]/page.tsx` (ramo somente leitura),
  `web/src/features/session/session-detail.tsx`

**Estimated scope:** S

---

## Task 22: Visão geral de Progresso

**Description:** Painel de leitura: métricas do período, volume semanal, volume por músculo, PRs e
atalhos.

**Acceptance criteria:**

- [ ] `GET /api/dashboard` + `GET /api/dashboard/muscle-volume` no mesmo período
- [ ] Volume por músculo em barras horizontais com valor mono à direita
- [ ] Atalhos para Histórico, Exercício e Corpo, com rótulo e link `info`
- [ ] Sem animação; densidade alta; nenhuma cor literal
- [ ] Estados vazio/erro/loading

**Verification:**

- [ ] Build succeeds: `pnpm lint && pnpm typecheck && pnpm build`
- [ ] Manual: trocar período e conferir que as duas chamadas mudam juntas

**Dependencies:** Tasks 14, 20
**Files likely touched:**

- `web/src/app/(app)/progress/page.tsx`,
  `web/src/features/progress/progress-overview.tsx`,
  `web/src/features/progress/muscle-bars.tsx`

**Estimated scope:** M

---

## Task 23: Estatísticas de exercício

**Description:** Histórico de um exercício: sessões, volume, melhor carga, melhor e1RM e evolução
mensal.

**Acceptance criteria:**

- [ ] `GET /api/exercises/{id}/stats` renderiza os cinco números em `DataRow`
- [ ] Gráfico mensal de volume e de e1RM a partir de `monthlyBuckets`
- [ ] Exercício nunca executado mostra vazio com atalho para a rotina
- [ ] Acesso a partir da lista de exercícios e do Progresso
- [ ] Nenhuma chamada por sessão: dados vêm do endpoint de stats

**Verification:**

- [ ] Build succeeds: `pnpm lint && pnpm typecheck && pnpm build`
- [ ] Manual: exercício com histórico e exercício novo

**Dependencies:** Task 22
**Files touched:**

- `web/src/app/(app)/progress/exercises/[id]/page.tsx`,
  `web/src/features/progress/exercise-stats.tsx`,
  `web/src/features/train/exercise-list.tsx` (link de entrada),
  `web/src/app/(app)/train/exercises/page.tsx` (lista e formulário de exercício)

**Estimated scope:** M

---

## Task 24: Corpo / bioimpedância

**Description:** Tendências corporais por métrica, com delta, média móvel e lista de medições.

**Acceptance criteria:**

- [ ] Seletor entre as seis métricas suportadas pelo backend
- [ ] `GET /api/bioimpedance/trend?metric&window` desenha valor + média móvel
- [ ] Delta absoluto e percentual no topo, com sinal e unidade corretos
- [ ] Lista de medições com data, fonte e link para histórico de alterações
- [ ] Estados: nenhuma medição, métrica sem valores, ponto único (sem linha falsa)
- [ ] Ações de editar e excluir medição com confirmação

**Verification:**

- [ ] Build succeeds: `pnpm lint && pnpm typecheck && pnpm build`
- [ ] Manual: duas medições em datas distintas mostram tendência; uma medição mostra aviso

**Dependencies:** Task 22
**Files touched:**

- `web/src/app/(app)/progress/body/page.tsx`,
  `web/src/features/progress/body-trends.tsx`,
  `web/src/features/progress/body-measurements.tsx`

**Estimated scope:** L

---

## Task 25: Nova medição e importação de PDF

**Description:** Duas entradas no mesmo fluxo: formulário manual e importação de PDF com revisão
obrigatória antes de gravar.

**Acceptance criteria:**

- [ ] Formulário manual com validação espelhada do backend (faixas de peso, altura, %, `measuredAt`
      não futuro) e erros por campo
- [ ] Upload multipart para `/api/bioimpedance/imports` com progresso neutro
- [ ] Polling de `GET /imports/{jobId}` até `DONE`/`FAILED`; erro do backend exibido como texto
- [ ] Tela de revisão com os campos extraídos editáveis e `POST /imports/{jobId}/confirm`
- [ ] Job duplicado (200 com job existente) não cria nova importação silenciosamente
- [ ] Cancelar o polling ao desmontar; sem intervalo órfão
- [ ] Envio duplicado bloqueado enquanto a requisição está em curso

**Verification:**

- [ ] Build succeeds: `pnpm lint && pnpm typecheck && pnpm build`
- [ ] Manual: criar medição manual e depois importar um PDF de exemplo

**Dependencies:** Task 24
**Files touched:**

- `web/src/app/(app)/progress/body/new/page.tsx`,
  `web/src/features/progress/measurement-form.tsx`,
  `web/src/features/progress/pdf-import.tsx`,
  `web/src/features/progress/import-review.tsx`

**Estimated scope:** L

---

## Task 26: Perfil, troca de senha, logout e exclusão

**Description:** A aba Perfil: dados editáveis, troca de senha, logout e exclusão de conta.

**Acceptance criteria:**

- [ ] Nome, e-mail e timezone editáveis (`PUT /api/users/me`), com validação IANA no cliente
- [ ] Username exibido (somente leitura nesta versão)
- [ ] Troca de senha (`PUT /api/users/me/password`): senha atual errada aparece como erro de campo,
      **sem deslogar**; sucesso limpa a sessão e leva a `/signin` com aviso
- [ ] *Sair* chama `POST /api/auth/logout`, limpa o átomo e navega
- [ ] *Excluir conta* exige digitar o username; `DELETE /api/users/me` e redireciona para `/signup`
- [ ] Unidade kg e idioma PT-BR como informação, sem controles falsos

**Verification:**

- [ ] Build succeeds: `pnpm lint && pnpm typecheck && pnpm build`
- [ ] Manual: trocar senha, entrar com a nova; senha antiga falha
- [ ] Manual: excluir conta de teste e confirmar que `/` redireciona para signin

**Dependencies:** Tasks 14, 15
**Files touched:**

- `web/src/app/(app)/profile/page.tsx`,
  `web/src/features/profile/profile-form.tsx`,
  `web/src/features/profile/password-form.tsx`,
  `web/src/features/profile/danger-zone.tsx`

**Estimated scope:** L

---

## Task 27: Manifest, ícone e service worker mínimo

**Description:** Tornar o PWA instalável com o mínimo: manifest, ícone `G` em `accent`, theme color e
service worker com cache de assets e fallback offline neutro.

**Acceptance criteria:**

- [ ] `manifest.webmanifest` com nome, `start_url: "/"`, `display: "standalone"`,
      `theme_color: #080B0A`, `background_color: #080B0A`, ícones 192 e 512
- [ ] Ícone tipográfico `G` em `accent` sobre `canvas`, sem mascote
- [ ] Service worker cacheia assets estáticos e fontes; navegação offline mostra tela neutra
- [ ] Nenhuma resposta de API é cacheada
- [ ] Instalação não quebra as telas de autenticação

**Verification:**

- [ ] Build succeeds: `pnpm build`
- [ ] Manual: Lighthouse instala; modo offline mostra a tela neutra, não erro de navegador

**Dependencies:** Tasks 14–26
**Files touched:**

- `web/src/app/manifest.ts` (ou `public/manifest.webmanifest`),
  `web/public/sw.js`, `web/public/icons/*`, `web/src/app/layout.tsx`

**Estimated scope:** M

---

## Task 28: Revisão de acessibilidade e contraste

**Description:** Passar o checklist do `brand-identity.md` §11 em cada tela entregue, corrigindo o que
falhar antes de considerar o plano concluído.

**Acceptance criteria:**

- [ ] Navegação completa por teclado em todas as telas, com foco visível
- [ ] Contraste medido nos pares reais de texto/fundo (4,5:1 normal, 3:1 grande)
- [ ] Estados não dependem só de cor (texto/ícone junto)
- [ ] 320px sem overflow horizontal em todas as telas
- [ ] Alvos de toque ≥48×48
- [ ] `prefers-reduced-motion` respeitado
- [ ] Nenhum emoji, copy motivacional ou âmbar

**Verification:**

- [ ] Build succeeds: `pnpm lint && pnpm typecheck && pnpm build`
- [ ] Manual: percorrer as 4 abas e as sub-rotas em 320px, 375px, 768px e 1024px

**Dependencies:** Tasks 16–27
**Files touched:**

- ajustes pontuais nos CSS Modules das telas

**Estimated scope:** M

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Migration de username falhar em contas com e-mail sem parte local válida | Alto | Backfill com fallback (`user` + id curto) e `WHERE username IS NULL`; testar contra dump real |
| Troca de login de `email` para `identifier` quebrar clientes existentes | Alto | Não há cliente publicado; front atualizado na Task 15; `AuthFlowIT` cobre os dois caminhos |
| Senha atual incorreta responder 401 e deslogar o usuário | Alto | Task 4 exige `400 INVALID_CURRENT_PASSWORD`; teste explícito |
| Duas páginas resolvendo `/` quebrarem o build | Alto | Task 14 remove `app/page.tsx` no mesmo passo da criação de `(app)/page.tsx` |
| Sessão ao vivo duplicar séries em retry | Alto | `clientLogId` gerado antes do POST e reutilizado no retry; teste manual com rede desligada |
| `204` do `active` estourar o parse Zod | Médio | `requestMaybe` (Task 11) antes de qualquer tela consumir |
| Lista de rotinas com N+1 em rede móvel | Médio | Task 6 entrega contagem e última execução no resumo |
| Gráficos pesarem em aparelho fraco | Médio | SVG simples, sem biblioteca de charts; animação só quando explicar mudança |
| `next/font/google` exigir rede na primeira build | Baixo | Já é o comportamento atual; build em CI precisa de rede na primeira execução |
| Backend e front divergirem de contrato | Médio | Snapshot OpenAPI (Task 9) + schemas Zod (Task 10) + `pnpm build` |

## Open Questions

- **Username no Perfil:** fica somente leitura nesta versão (assumido). Permitir edição exige tratar
  unicidade e o identificador de login; se for desejado, é uma task extra.
- **Signup exige username:** assumido que sim, com validação de formato. Se a preferência for
  gerar automaticamente a partir do e-mail, a Task 2 muda.
- **Revogação de sessões na troca de senha:** assumido revogar todas, exigindo novo login. Manter a
  sessão atual exigiria identificar o refresh token corrente.
- **Ordem das abas no Progresso:** Histórico dentro de Progresso conforme decisão, mas o lugar exato
  do link (atalho no topo ou seção fixa) será decidido ao montar a Task 22.
