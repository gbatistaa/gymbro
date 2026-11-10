# TODO — API pronta para o mobile

Decisões fechadas: **Bearer** · **online-only** · **`/api/v1` agora**.
Plano completo e critérios de aceite: `backend/tasks/api-mobile/plan.md`.
Itens abertos herdados de `backend/tasks/plan.md` estão cobertos aqui (CORS, logout, sessão por dispositivo).

Comandos: focado `./mvnw -Dtest=<Teste> test` · suíte `./mvnw test` · versão `./mvnw -q compile`.
Testes `@DisplayName` em inglês (projeto fora de `coding/ses`).

---

## Fase 1 — Transporte (Bearer)

- [x] Task 1: Login e refresh devolvem tokens no corpo (`AuthTokensDto`, sem `Set-Cookie`)
- [x] Task 2: `JwtAuthenticationFilter` lê `Authorization: Bearer`
- [x] Task 3: Migrar `AuthControllerTest`, `AuthFlowIT`, `UserControllerTest` (helper `AuthTestSupport` dispensado — cada IT já tinha helper local de uma linha)
- [x] Task 4: Migrar 6 ITs de domínio (`ExerciseOwnershipIT`, `WorkoutSessionFlowIT`, `PlaylistFlowIT`, `BioimpedanceFlowIT`, `BioimpedanceImportFlowIT`, `AnalyticsFlowIT`)
- [x] Task 5: `POST /api/auth/logout`

**Checkpoint Fase 1**
- [x] `./mvnw test` verde (144 testes)
- [ ] `curl` login → header → rota protegida 200; sem header → 401 (provado por `AuthFlowIT` em MockMvc; falta o smoke com servidor real)
- [x] Nenhuma linha `Set-Cookie` na resposta de login

## Fase 2 — Sessões

- [x] Task 6: Uma sessão por dispositivo (migration `V9` remove `uk_refresh_tokens_user`)

**Checkpoint Fase 2**
- [x] Dois logins simultâneos funcionam
- [x] Logout de um não derruba o outro

## Fase 3 — Versão: CANCELADA

Decisão: **não versionar** (projeto em desenvolvimento, sem cliente publicado). Tasks 7 e 8 canceladas;
dependências religadas para a Task 6.

## Fase 4 — Contrato de erro

- [x] Task 9: `code` estável no `ErrorResponse` + ADR (`docs/adr/0001-contrato-de-erro.md`)
- [x] Task 10: `errors[]` por campo na validação

**Checkpoint Fase 4**
- [x] 3 campos inválidos no register → 3 itens em `errors` (provado em `AuthControllerTest`)
- [x] `401` → `UNAUTHENTICATED`, `409` → `SESSION_ALREADY_ACTIVE` (provado em `AuthFlowIT` e `WorkoutSessionFlowIT`)

## Fase 5 — Fuso

- [x] Task 11: `users.timezone` (migration `V10`)
- [x] Task 12: Dashboard e streak no fuso do usuário
- [ ] Task 12b (follow-up): `WorkoutLogRepository.monthlyExerciseBuckets` (native query, linha ~78) ainda usa `'America/Sao_Paulo'` fixo — o bucket mensal de estatística por exercício ignora `users.timezone`

**Checkpoint Fase 5**
- [x] Sessão de domingo 20:00Z (17:00 BRT) cai na semana de 02/11 em São Paulo e na de 09/11 em Tóquio — provado em `DashboardServiceTest`

## Fase 6 — Contrato publicado

- [x] Task 13: springdoc 3.2.0 + `/v3/api-docs` + `docs/api/openapi.json` versionado (`OpenApiContractIT` grava o snapshot)
- [x] Task 14: tipos TS gerados em `mobile/src/lib/api/schema.d.ts` + `npm run api:types` + `npx tsc --noEmit` verde

**Checkpoint Fase 6**
- [x] `tsc --noEmit` verde com tipos gerados
- [ ] Alterar DTO no backend e regenerar acusa divergência (pipeline existe; falta a demonstração explícita)

## Fase 7 — Transversais

- [x] Task 15: `GET /api/health` (público, sem DB)
- [x] Task 16: Rate limiting no login (429 + `Retry-After`, 5 falhas/15min por IP+e-mail)
- [x] Task 17: CORS para Expo web (origem explícita, sem credenciais)
- [x] Task 18: `DELETE /api/users/me` + ADR (`docs/adr/0002-exclusao-de-conta.md`)

**Checkpoint Final**
- [x] Suíte completa verde (161 testes)
- [ ] `docs/api-flow.md` com o fluxo ponta a ponta via `curl` (não escrito: exigiria servidor real)
- [ ] Revisão humana antes do primeiro `fetch` no mobile

---

## Fora de escopo (decisão: online-only)

- Batch de logs (`POST /logs/batch`)
- Delta pull (`GET /changes?since=`)
- `performedAt` no log — servidor carimba no envio; `clientLogId` cobre retry
- Fila local / SQLite / sync
