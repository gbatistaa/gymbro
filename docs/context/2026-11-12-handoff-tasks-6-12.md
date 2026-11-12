# Gymbro — handoff das Tasks 6–12 (backend + fundação do frontend)

**Data:** 2026-11-12
**Repositório:** `gymbro` · branch `main` · working tree limpo
**Último commit:** `ceac4ad` (Task 12)
**Handoffs anteriores:** `docs/context/2026-11-11-handoff.md` (stack, identidade, auth por cookie) e
`docs/context/2026-11-12-handoff.md` (Tasks 1–5). Este documento cobre **só o que mudou depois
disso**.

---

## 1. Estado atual

- **12 de 28 tasks concluídas.** Fase 1 do backend **fechada** (Tasks 1–9) e Fase 2 quase toda
  (Tasks 10–12); falta a Task 13 (primitivos de UI) para liberar as telas.
- **Backend: 186 testes, 0 falhas.** **Web: `pnpm lint`, `pnpm typecheck` e `pnpm build` verdes.**
- `docs/api/openapi.json` com **34 rotas** publicadas, regenerado pelo `OpenApiContractIT`.
- Nada pendente em git: cada task foi commitada conforme concluída.

### O que existe no frontend hoje

| Rota | Estado |
| --- | --- |
| `/` | ainda é o placeholder "Hello world!" (some na Task 14) |
| `/signin` | login por **e-mail ou username** |
| `/signup` | cadastro com **username** |

Não existe casca autenticada, barra inferior, guard de rotas nem tela interna. A primeira tela real
é a Task 16, depois da casca da Task 14.

---

## 2. Tasks 6–12: o que foi entregue

### Task 6 — Resumo de rotina na listagem (`7a88ec7`)

- `GET /api/playlists` passou a devolver `PlaylistSummaryDto` (`exerciseCount`, `lastPerformedAt`).
  `GET /{id}` e as respostas de criar/editar/clonar/arquivar continuam com `PlaylistDto`.
- Uma consulta agregada (`findSummariesByUserId`), sem laço por rotina — o N+1 morreu aqui.
- `lastPerformedAt` considera **só** sessões `FINISHED` (sessão em andamento não conta).
- **Efeito colateral:** `findByUserIdOrderByName` foi removida por ficar sem uso.

### Task 7 — `GET /api/dashboard/muscle-volume?from&to` (`d784833`)

- `[{ muscle, volume, sets }]`, só sessões `FINISHED`, escopado por usuário, ordenado por volume
  desc, músculo normalizado (`Peito`/`peito` caem juntos).
- Sem `from`/`to` usa **12 semanas de calendário** no fuso do usuário.
- Usuário sem treinos recebe `[]`, não 404.

### Task 8 — Fuso do usuário nos buckets mensais (`1f9e98b`)

- Bug real, reproduzido antes da correção: `monthlyExerciseBuckets` fixava `'America/Sao_Paulo'`.
  Uma sessão em `2026-10-31T16:00Z` caía em outubro para um usuário de Tóquio (deveria ser
  novembro).
- A query agora recebe `:zone` (`CAST(:zone AS text)`); `ExerciseStatsService` resolve o fuso pelo
  `UserRepository` (dependência nova) antes de chamar.
- Teste de integração cobre exatamente essa virada de mês.

### Task 9 — Snapshot OpenAPI (`798ed4b`)

- Snapshot já estava correto (é reescrito a cada `./mvnw test`). O trabalho foi **fixar o contrato**:
  o `OpenApiContractIT` agora falha se `LoginDto.identifier` sumir, se `email` voltar ao login, ou se
  `PUT /users/me/password`, `GET /exercises/muscles`, `GET /dashboard/muscle-volume` e
  `UserDto.username` desaparecerem.

### Task 10 — Contratos Zod (`701b49a`)

Arquivos em `web/src/contracts/`: `auth.ts` (atualizado), `page.ts`, `exercise.ts`, `playlist.ts`,
`session.ts`, `analytics.ts`, `bioimpedance.ts` e `primitives.ts` (formato de data compartilhado,
`z.iso.datetime({ offset: true })`).

- `pageSchema<T>(item)` é a fábrica de paginação (`PageDto`).
- `sessionStatusSchema` = `IN_PROGRESS | FINISHED | ABANDONED`.
- Anuláveis usam `nullish()`; `JsonNode` do backend (`oldData`, `newData`, `result`) usa
  `z.unknown().nullish()` **de propósito** — não há estrutura estável para validar.

### Task 11 — `requestMaybe` + `useResource` (`afbf689`)

- `requestMaybe(config, schema)` em `lib/http.ts`: `204` e corpo vazio devolvem `null`.
- `useResource(key, load)` em `lib/use-resource.ts`: `{ data, error, isLoading, reload }`.
- `describeApiError` em `lib/api-error-text.ts`: traduz `code` do contrato de erro para PT-BR.
- **Duas divergências do plano, ambas por fonte oficial:**
  1. Assinatura virou `(key, loader)` em vez de `(loader, deps)`: a doc do `useEffect` exige deps
     inline e desencoraja suprimir `react-hooks/exhaustive-deps`.
     https://react.dev/reference/react/useEffect#specifying-reactive-dependencies
  2. `isLoading` é **derivado** do resultado corresponder ao pedido, não setado no efeito: o lint
     `react-hooks/set-state-in-effect` (eslint-config-next 16) proíbe `setState` síncrono em efeito.
- Descarte de resposta fora de ordem segue o padrão `ignore` documentado:
  https://react.dev/reference/react/useEffect#fetching-data-with-effects

### Task 12 — `lib/format.ts` (`ceac4ad`)

`formatKg`, `formatVolume`, `formatPercent`, `formatCount`, `formatDate`, `formatDateTime`,
`formatDuration`, `formatRelative`.

- `formatDuration` recebe **segundos** (serve `restSeconds` e duração de sessão).
- `-0` normalizado para `0` (o `Intl` formata `-0` como `"-0"`).
- Entrada nula/`NaN`/`Infinity` → `—`.
- `formatRelative` recebe o `timeZone` do usuário e compara **dias de calendário** no fuso dele.

---

## 3. Como usar a fundação criada (para as telas das Tasks 13+)

```ts
// leitura com estados
const { data, error, isLoading, reload } = useResource(
  `playlists:${includeArchived}`,      // chave = identidade do pedido
  () => request({ url: "/api/playlists", params: { includeArchived } }, z.array(playlistSummarySchema)),
);
```

- **Sempre** `request`/`requestMaybe` de `lib/http.ts` — nunca `axios`/`fetch` solto.
- Contrato novo? criar `web/src/contracts/<dominio>.ts` e inferir o tipo com `z.infer`.
- Número, data ou duração na tela? usar `lib/format.ts`; nunca `toFixed`/`toLocaleString` local.
- Erro para o usuário? `describeApiError(error)` (ou `useResource`, que já entrega traduzido).
- Estado compartilhado? Jotai (`stores/`). Estado de tela? `useState`.

---

## 4. Pegadinhas encontradas nesta sessão

- **`pnpm build` do Next precisa de rede na primeira execução** (`next/font/google`).
- **`react-hooks/set-state-in-effect`** quebra build no eslint-config-next 16: não setar estado
  síncrono dentro de `useEffect`; derive.
- **JSONPath do MockMvc é sensível** a filtros com `?(@.x == 'v')`; asserções por índice ou
  `hasItem` são mais estáveis.
- **Postgres devolve timestamps com microssegundos**: ao comparar `Instant` em teste, truncar com
  `ChronoUnit.MICROS` ou comparar o JSON serializado.
- **`session.status` precisa ser `FINISHED`** para entrar em qualquer agregado; `IN_PROGRESS` e
  `ABANDONED` são ignorados de propósito em `PlaylistSummaryDto`, `muscle-volume` e nas stats.
- **Um usuário só pode ter uma sessão `IN_PROGRESS`**: em teste de integração, finalize ou abandone
  a sessão anterior antes de abrir a próxima (`409 SESSION_ALREADY_ACTIVE`).

---

## 5. Ambiente

- `.sdkmanrc` na raiz do repo com `java=21.0.8-tem`; `./mvnw` já roda em Java 21 nesta shell.
  Se o `java -version` mostrar 17, use
  `JAVA_HOME=~/.sdkman/candidates/java/21.0.8-tem ./mvnw ...`.
- Backend: `./mvnw test` (Testcontainers, Docker necessário) · focado: `./mvnw -Dtest=Classe test`.
- Web: `cd web && pnpm lint && pnpm typecheck && pnpm build`.
- Migrations: `-- author: jacob` no topo.
- **Git: nada de `commit`/`push`/PR sem autorização explícita do usuário.**

---

## 6. Próxima task: 13 — Primitivos em `components/ui/`

`web/src/components/ui/` (não existe ainda): `SectionLabel`, `DataRow`, `Button`, `Field`,
`EmptyState`, `ErrorState` (com `retry`), `Skeleton`, `Notice`, `ConfirmDialog` + `ui.module.css`.

Regras que vêm de `docs/brand-identity.md` e não devem ser improvisadas:

- Régua (`--color-rule`), não card com sombra; número em mono, tabular, alinhado à direita.
- Botão primário verde (`--color-accent`) com texto `--color-on-accent`, altura ≥ 48px, raio 6px.
- Foco visível ≥ 2px; `aria-invalid`/`aria-describedby` nos campos; `aria-busy` no loading.
- Nenhuma cor literal: só tokens de `globals.css`.
- `ConfirmDialog` com foco inicial em *cancelar* e fechando com `Esc`.

Depois da Task 13: **Task 14** (casca `(app)` + barra inferior + guard; **remover
`web/src/app/page.tsx`** no mesmo passo, senão duas rotas resolvem `/`) e **Task 15** (ver §7).

---

## 7. Atenção: Task 15 já está funcionalmente feita

A troca de contrato da Task 10 obrigou a adaptar os formulários, então já existe:

- signin com campo "E-mail ou usuário" (`identifier`, `autoComplete="username"`);
- signup com campo "Usuário" e dica de formato;
- erro de username duplicado aparecendo **no campo** (backend devolve
  `errors:[{field:"username"}]`, e `AuthField`/`errors.ts` cobrem os novos campos);
- mensagem geral de conflito neutralizada ("Já existe uma conta com estes dados.").

O que resta da Task 15 é **verificação manual** (cadastro com username repetido mostrando o erro no
campo, login por e-mail e por username). Se confirmar, marque a task como concluída em
`tasks/todo.md` e `tasks/plan.md`.

---

## 8. Riscos e lacunas conhecidas

- **Não há runner de teste no `web`.** O `format.ts` foi validado por um script temporário de
  `assert` (Node 24, fora do repo); `useResource` ainda não tem teste algum. Adotar vitest é decisão
  explícita, fora do plano.
- **`GET /api/dashboard/muscle-volume` aceita `from`/`to` sem limite de janela.** Se pesar com dados
  reais, medir antes de limitar.
- **O snapshot OpenAPI só é regenerado quando a suíte roda.** Quem alterar DTO e não rodar
  `./mvnw test` deixa o arquivo defasado.
- **`useResource` zera o dado quando uma nova chave falha** (mostra erro, não o último dado bom).
  Mudar isso é uma linha na derivação, se o produto preferir.
- Limites herdados que continuam valendo: access token não revogado no logout, sem rotação de
  refresh, Bearer como fallback no backend, sem Tailwind/shadcn, sem service worker.
