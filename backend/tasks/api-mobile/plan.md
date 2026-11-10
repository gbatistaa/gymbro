# Implementation Plan: API pronta para o mobile (Bearer, `/v1`, online-only)

## Overview

Fechar a API do `backend/` para que o app mobile (`mobile/`, Expo + React Native) consiga
consumir tudo sem gambiarra de transporte, sem contrato implícito e sem adivinhar erro.

Escopo derivado da auditoria de prontidão mobile. Três decisões do usuário fecham o desenho:

1. **Bearer token** (não cookie). Access JWT no header `Authorization`, refresh opaco no corpo da
   resposta, guardado no `expo-secure-store` do lado do app.
2. **Online-only** no MVP. Sem fila local, sem sync em lote, sem delta pull. Falha de rede é erro
   visível com retry manual.
3. **`/api/v1` agora.** Antes de existir qualquer cliente instalado.

Este plano **complementa** `backend/tasks/plan.md` (fluxo de security) e resolve os itens que
ficaram naquele checkpoint final — CORS, logout e sessões por dispositivo. Não substitui nem
sobrescreve os arquivos existentes.

## Architecture Decisions

- **Bearer substitui cookie por completo**, não coexiste. O backend é novo e não tem clientes em
  produção; manter os dois caminhos dobra a superfície de teste e o risco de autenticar pelo
  caminho errado. Web (Expo web) usa o mesmo Bearer via memória + `localStorage`, não cookie.
- **Refresh continua opaco e com hash SHA-256** (já implementado). Só muda o transporte: sai do
  `Set-Cookie`, entra no JSON.
- **Uma linha de refresh por dispositivo** em vez de uma por usuário. A restrição atual
  (`uk_refresh_tokens_user`) derruba a sessão do desktop quando o celular faz login. Custo:
  remover o índice único e inserir por login. Não é rotação de token — é convivência.
- **Erro com `code` estável + `errors[]` por campo.** `message` é texto para humano e pode mudar;
  o app precisa de uma chave para decidir comportamento e de `field` para posicionar o erro embaixo
  do input (exigência do `docs/brand-identity.md` §9).
- **`/api` sem versão.** Decidido durante a execução: não há cliente instalado e o projeto está em
  desenvolvimento, então versionar agora só adicionaria cerimônia. Quando existir app publicado, a
  versão entra como corte seco (sem alias), não como migração em fases.
- **OpenAPI depois do contrato de erro**, para que os tipos gerados já tragam `code` e `errors[]`.
  Gerador só, sem client hand-written.
- **Sem offline** ⇒ `clientLogId` (já idempotente em `WorkoutSessionService`) permanece como única
  proteção contra duplo envio por retry manual. Nada de batch nem cursor.
- **Testes**: `*Test` unitário, `*IT` com Testcontainers (padrão do repo), `@DisplayName` em
  **inglês** (projeto fora de `coding/ses`, conforme regra global).

## Task List

### Fase 1 — Transporte (Bearer)

- [ ] Task 1: Login e refresh devolvem tokens no corpo
- [ ] Task 2: Filtro JWT lê `Authorization: Bearer`
- [ ] Task 3: Migrar testes de auth para Bearer
- [ ] Task 4: Migrar ITs de domínio para Bearer
- [ ] Task 5: `POST /api/auth/logout`

**Checkpoint Fase 1**
- [ ] `./mvnw test` verde (27 testes + os migrados)
- [ ] `curl` login → header → rota protegida 200; sem header → 401

### Fase 2 — Sessões

- [ ] Task 6: Uma sessão por dispositivo

**Checkpoint Fase 2**
- [ ] Dois logins simultâneos; ambos os access tokens funcionam
- [ ] Logout de um dispositivo não derruba o outro

### Fase 3 — Versão ~~(cancelada)~~

Decisão do usuário: **não versionar**. O projeto está em desenvolvimento e não há cliente publicado,
então `/api/...` permanece e as Tasks 7 e 8 foram canceladas. As dependências que apontavam para
elas agora apontam para a Task 6 (última entrega de infraestrutura de auth).

### Fase 4 — Contrato de erro

- [ ] Task 9: `code` estável no `ErrorResponse`
- [ ] Task 10: `errors[]` por campo na validação

**Checkpoint Fase 4**
- [ ] `curl` com `weight: -1` devolve `{code, errors:[{field,message}]}`
- [ ] 401, 404, 409 têm `code` distinto

### Fase 5 — Fuso

- [ ] Task 11: `users.timezone`
- [ ] Task 12: Dashboard e streak no fuso do usuário

**Checkpoint Fase 5**
- [ ] Sessão iniciada 22:00 BRT conta no dia/semana corretos

### Fase 6 — Contrato publicado

- [ ] Task 13: springdoc + `/v3/api-docs`
- [ ] Task 14: Gerar tipos TS no mobile

**Checkpoint Fase 6**
- [ ] `openapi.json` versionado e tipos TS compilando no mobile

### Fase 7 — Transversais

- [ ] Task 15: `GET /api/v1/health`
- [ ] Task 16: Rate limiting no login
- [ ] Task 17: CORS para Expo web
- [ ] Task 18: `DELETE /api/v1/users/me`

**Checkpoint Final**
- [ ] Suíte verde
- [ ] Fluxo completo documentado em `docs/api-flow.md`
- [ ] Revisão humana antes do primeiro `fetch` no mobile

---

## Task 1: Login e refresh devolvem tokens no corpo

**Description:** Trocar o transporte de cookies por tokens no JSON. `POST /api/auth/login` e
`POST /api/auth/refresh` passam a devolver `AuthTokensDto` com access token, TTL em segundos e
refresh token. Remove `ResponseCookie` e `Set-Cookie` de `AuthService`.

**Acceptance criteria:**
- [ ] `AuthTokensDto(accessToken, tokenType, expiresIn, refreshToken)` criado em `auth/dto/`
- [ ] `POST /api/auth/login` → `200` com `AuthTokensDto` no corpo e **nenhum** `Set-Cookie`
- [ ] `POST /api/auth/refresh` recebe `{refreshToken}` no corpo (não cookie) → `200` com novo `AuthTokensDto`
- [ ] `register` continua devolvendo `UserDto` (não autentica)
- [ ] Refresh inválido/expirado/ausente → `401` com `ErrorResponse`

**Verification:**
- [ ] Tests pass: `./mvnw -Dtest=AuthControllerTest test`
- [ ] Build succeeds: `./mvnw -q compile`
- [ ] Manual: `curl -i -X POST /api/auth/login` sem linha `Set-Cookie` no output

**Dependencies:** None
**Files likely touched:**
- `src/main/java/com/gbatistadev/gymbro/auth/dto/AuthTokensDto.java` (novo)
- `src/main/java/com/gbatistadev/gymbro/auth/AuthService.java`
- `src/main/java/com/gbatistadev/gymbro/auth/AuthController.java`
- `src/main/java/com/gbatistadev/gymbro/auth/dto/RefreshRequest.java` (novo)

**Estimated scope:** M

---

## Task 2: Filtro JWT lê `Authorization: Bearer`

**Description:** `JwtAuthenticationFilter` deixa de varrer `getCookies()` e passa a ler o header
`Authorization`. Header ausente/malformado/token inválido → segue sem autenticação (o entry point
responde 401 no shape padrão).

**Acceptance criteria:**
- [ ] Header `Authorization: Bearer <jwt>` válido autentica com principal = `UUID` do usuário
- [ ] Header ausente, sem prefixo `Bearer `, ou token expirado → `/api/users/me` responde 401
- [ ] Nenhuma referência a `getCookies()` permanece no filtro

**Verification:**
- [ ] Tests pass: `./mvnw -Dtest=UserControllerTest test`
- [ ] Build succeeds: `./mvnw -q compile`
- [ ] Manual: requisição com header válido → 200; com header trocado → 401

**Dependencies:** Task 1
**Files likely touched:**
- `src/main/java/com/gbatistadev/gymbro/config/security/JwtAuthenticationFilter.java`

**Estimated scope:** S

---

## Task 3: Migrar testes de auth para Bearer

**Description:** Atualizar os testes de auth e de usuário para obter o token do corpo do login e
enviar `Authorization`. Extrair um helper de teste para não repetir a sequência
login → extrair token → montar header nos ITs.

**Acceptance criteria:**
- [ ] `AuthControllerTest` cobre login/refresh lendo tokens do corpo
- [ ] `AuthFlowIT` cobre register → login → rota protegida → refresh → retry → 401
- [ ] `UserControllerTest` usa header em vez de cookie
- [ ] Nenhum teste usa `Cookie` nem `Set-Cookie` na camada de auth

**Verification:**
- [ ] Tests pass: `./mvnw -Dtest=AuthControllerTest,AuthFlowIT,UserControllerTest test`
- [ ] Build succeeds: `./mvnw -q compile`

**Dependencies:** Tasks 1, 2
**Files likely touched:**
- `src/test/java/com/gbatistadev/gymbro/auth/AuthControllerTest.java`
- `src/test/java/com/gbatistadev/gymbro/auth/AuthFlowIT.java`
- `src/test/java/com/gbatistadev/gymbro/user/UserControllerTest.java`
- `src/test/java/com/gbatistadev/gymbro/support/AuthTestSupport.java` (novo helper)

**Estimated scope:** M

---

## Task 4: Migrar ITs de domínio para Bearer

**Description:** Os 6 ITs de domínio autenticam via cookie. Trocar pelo helper de `AuthTestSupport`.
Mudança mecânica; a suíte é a prova de que nenhuma rota ficou sem proteção funcional.

**Acceptance criteria:**
- [ ] `ExerciseOwnershipIT`, `WorkoutSessionFlowIT`, `PlaylistFlowIT`, `BioimpedanceFlowIT`,
      `BioimpedanceImportFlowIT` e `AnalyticsFlowIT` autenticam por header
- [ ] Nenhuma referência a `access_token`/`refresh_token` sobra em `src/test`
- [ ] Asserções de negócio inalteradas

**Verification:**
- [ ] Tests pass: `./mvnw test`
- [ ] Build succeeds: `./mvnw test` (suíte completa)

**Dependencies:** Task 3
**Files likely touched:**
- os 6 arquivos `*IT.java` em `src/test/java/com/gbatistadev/gymbro/{exercise,workout_session,playlist,bioimpedance,analytics}/`

**Estimated scope:** L (mecânico, 6 arquivos)

---

## Task 5: `POST /api/auth/logout`

**Description:** Encerrar a sessão do dispositivo. Apaga a linha de refresh correspondente ao token
enviado, para que ele não possa ser usado depois. Sem o token, encerra todas as sessões do usuário.

**Acceptance criteria:**
- [ ] `POST /api/auth/logout` com `{refreshToken}` → `204` e o hash deixa de existir em `refresh_tokens`
- [ ] Reusar o refresh token depois do logout → `401`
- [ ] Sem `refreshToken` no corpo → encerra todas as sessões do usuário autenticado
- [ ] Logout sem autenticação válida → `401`

**Verification:**
- [ ] Tests pass: `./mvnw -Dtest=AuthControllerTest test`
- [ ] Build succeeds: `./mvnw -q compile`
- [ ] Manual: login → logout → refresh com o mesmo token retorna 401

**Dependencies:** Task 1
**Files likely touched:**
- `src/main/java/com/gbatistadev/gymbro/auth/AuthController.java`
- `src/main/java/com/gbatistadev/gymbro/auth/AuthService.java`
- `src/main/java/com/gbatistadev/gymbro/user/RefreshTokenRepository.java`
- `src/test/java/com/gbatistadev/gymbro/auth/AuthControllerTest.java`

**Estimated scope:** M

---

## Task 6: Uma sessão por dispositivo

**Description:** Permitir que web e mobile coexistam. Remove o índice único `uk_refresh_tokens_user`
e passa a inserir uma linha por login em vez de sobrescrever. `refresh` resolve a sessão pelo hash.

**Acceptance criteria:**
- [ ] Migration `V9__refresh_tokens_per_device.sql` remove `uk_refresh_tokens_user` e mantém índice
      por `token_hash`
- [ ] `login` insere novo registro; não apaga os existentes
- [ ] Dois refresh tokens do mesmo usuário funcionam em paralelo
- [ ] Logout de um deixa o outro válido

**Verification:**
- [ ] Tests pass: `./mvnw -Dtest=AuthFlowIT test`
- [ ] Build succeeds: `./mvnw test`
- [ ] Manual: login em duas "sessões" (dois curls) → ambos os refresh devolvem 200

**Dependencies:** Tasks 1, 5
**Files likely touched:**
- `src/main/resources/db/migration/V9__refresh_tokens_per_device.sql` (novo)
- `src/main/java/com/gbatistadev/gymbro/user/RefreshToken.java`
- `src/main/java/com/gbatistadev/gymbro/auth/AuthService.java`
- `src/test/java/com/gbatistadev/gymbro/auth/AuthFlowIT.java`

**Estimated scope:** M

---

## Task 7: ~~`/api/v1` nos controllers e no `SecurityConfig`~~ — CANCELADA (não versionar)

**Description:** Fixar a versão antes de existir cliente. Ajusta o `@RequestMapping` dos 8
controllers e o matcher público de `/api/auth/**` no `SecurityConfig`.

**Acceptance criteria:**
- [ ] Os 8 controllers respondem sob `/api/v1/...`
- [ ] `SecurityConfig` libera `/api/v1/auth/**` como público
- [ ] Nenhuma rota responde em `/api/...` sem `v1`
- [ ] Sem alias de compatibilidade (não há cliente legado)

**Verification:**
- [ ] Build succeeds: `./mvnw -q compile`
- [ ] Manual: `curl /api/v1/users/me` sem header → 401; `/api/users/me` → 404

**Dependencies:** Task 1
**Files likely touched:**
- `auth/AuthController.java`, `exercise/ExerciseController.java`, `playlist/PlaylistController.java`,
  `workout_session/WorkoutSessionController.java`, `analytics/DashboardController.java`,
  `user/UserController.java`, `bioimpedance/BioimpedanceController.java`,
  `bioimpedance/job/BioimpedanceImportController.java`
- `config/security/SecurityConfig.java`

**Estimated scope:** M

---

## Task 8: ~~Atualizar caminhos nos testes~~ — CANCELADA junto com a Task 7

**Description:** Mudança mecânica dos paths em todos os testes afetados pela versão. A suíte verde é
a garantia de que nenhum endpoint ficou órfão.

**Acceptance criteria:**
- [ ] Nenhuma string `"/api/` sem `v1` em `src/test`
- [ ] Suíte completa verde

**Verification:**
- [ ] Tests pass: `./mvnw test`
- [ ] Manual: `grep -rn '"/api/' src/test | grep -v '/api/v1'` vazio

**Dependencies:** Task 7
**Files likely touched:**
- os `*Test.java` e `*IT.java` que batem em `MockMvc`/`TestRestTemplate`

**Estimated scope:** M (mecânico)

---

## Task 9: `code` estável no `ErrorResponse`

**Description:** Adicionar um identificador de erro que o app possa testar sem parsear texto. Cada
exceção de domínio ganha seu `code`; o entry point de 401 também.

**Acceptance criteria:**
- [ ] `ErrorResponse` ganha `code` (ex.: `SESSION_ALREADY_ACTIVE`, `CLIENT_LOG_CONFLICT`,
      `VALIDATION_FAILED`, `UNAUTHENTICATED`, `NOT_FOUND`)
- [ ] Todo `@ExceptionHandler` e o `AuthenticationEntryPoint` preenchem `code`
- [ ] `message` continua legível por humano e não é usado como chave
- [ ] ADR curto em `docs/adr/` explicando o contrato de erro

**Verification:**
- [ ] Tests pass: `./mvnw test`
- [ ] Manual: 401, 404 e 409 mostram `code` distintos no JSON

**Dependencies:** Task 6
**Files likely touched:**
- `errors/ErrorResponse.java`, `errors/GlobalExceptionHandler.java`,
  `errors/exceptions/*.java`, `config/security/SecurityConfig.java`

**Estimated scope:** M

---

## Task 10: `errors[]` por campo na validação

**Description:** Hoje `MethodArgumentNotValidException` junta todas as mensagens numa string com
`"; "`, o que impede mostrar o erro embaixo do campo — exigência do `brand-identity.md` §9.
Passa a devolver a lista por campo, mantendo `message` como resumo.

**Acceptance criteria:**
- [ ] `400` de validação devolve `errors: [{field, message}]`
- [ ] `message` permanece com o resumo concatenado (compatível com o que já existe)
- [ ] Campo com múltiplas violações aparece uma vez por violação

**Verification:**
- [ ] Tests pass: `./mvnw -Dtest=WorkoutSessionServiceTest test` + teste de controller novo
- [ ] Manual: `POST /api/v1/sessions` com `weight: -1, reps: 0` → dois itens em `errors`

**Dependencies:** Task 9
**Files likely touched:**
- `errors/ErrorResponse.java`, `errors/GlobalExceptionHandler.java`,
  `errors/FieldErrorDto.java` (novo)

**Estimated scope:** S

---

## Task 11: `users.timezone`

**Description:** O backend agrega tudo em UTC. Um treino às 22:00 em São Paulo cai no dia seguinte
e contamina "hoje", streak e semana. Guardar o fuso do usuário.

**Acceptance criteria:**
- [ ] Migration `V10__users_timezone.sql` adiciona `timezone VARCHAR(64) NOT NULL DEFAULT 'America/Sao_Paulo'`
- [ ] `User` expõe `timezone`; `UpdateUserDto` aceita alteração validada contra `ZoneId.of`
- [ ] `UserDto` e `UserSummaryProjection` devolvem `timezone`
- [ ] Fuso inválido → `400` com `code` de validação

**Verification:**
- [ ] Tests pass: `./mvnw -Dtest=UserServiceTest,UserControllerTest test`
- [ ] Build succeeds: `./mvnw test`
- [ ] Manual: `PUT /api/v1/users/me {"timezone":"Europe/Lisbon"}` → 200 e persistido

**Dependencies:** Task 6
**Files likely touched:**
- `src/main/resources/db/migration/V10__users_timezone.sql` (novo)
- `user/User.java`, `user/dto/UpdateUserDto.java`, `user/dto/UserDto.java`,
  `user/UserSummaryProjection.java`

**Estimated scope:** M

---

## Task 12: Dashboard e streak no fuso do usuário

**Description:** Aplicar o fuso nas agregações de dashboard, semana e streak, para que "SEMANA 45"
do design bata com o que o usuário viveu.

**Acceptance criteria:**
- [ ] Sessão iniciada 22:00 BRT de segunda conta naquela segunda e naquele semana ISO
- [ ] % de aderência e streak usam o mesmo fuso
- [ ] `DashboardDto` documenta o fuso usado no cálculo

**Verification:**
- [ ] Tests pass: `./mvnw -Dtest=DashboardServiceTest,AnalyticsFlowIT test`
- [ ] Manual: criar sessão com `startedAt` 01:00Z, timezone `America/Sao_Paulo` → contada no dia anterior

**Dependencies:** Task 11
**Files likely touched:**
- `analytics/DashboardService.java`, repositórios de agregação, `analytics/dto/DashboardDto.java`

**Estimated scope:** M

---

## Task 13: springdoc + `/v3/api-docs`

**Description:** Publicar o contrato gerado, depois que o shape de erro está estável.

**Acceptance criteria:**
- [ ] `springdoc-openapi-starter-webmvc-ui` no `pom.xml` (versão gerenciada ou explícita)
- [ ] `/v3/api-docs` acessível sem token em dev, protegido ou desabilitado em produção
- [ ] `openapi.json` gerado no build e versionado no repo
- [ ] Schemas de erro mostram `code` e `errors[]`

**Verification:**
- [ ] Build succeeds: `./mvnw -q package`
- [ ] Manual: `curl /v3/api-docs | jq '.components.schemas.ErrorResponse'`

**Dependencies:** Task 10
**Files likely touched:**
- `pom.xml`, `application.yaml`, `config/OpenApiConfig.java` (novo)

**Estimated scope:** S

---

## Task 14: Gerar tipos TS no mobile

**Description:** Consumir o contrato em vez de redigitar DTOs à mão. Um script gera os tipos;
o mobile importa e o compilador acusa divergência.

**Acceptance criteria:**
- [ ] `openapi-typescript` como devDependency do `mobile/`
- [ ] Script `npm run api:types` lê `openapi.json` e escreve `src/lib/api/schema.d.ts`
- [ ] `npx tsc --noEmit` passa com os tipos gerados
- [ ] Tipos gerados são commitados

**Verification:**
- [ ] Build succeeds: `cd mobile && npx tsc --noEmit`
- [ ] Manual: alterar um DTO no backend → regenerar → `tsc` acusa a divergência

**Dependencies:** Task 13
**Files likely touched:**
- `mobile/package.json`, `mobile/src/lib/api/schema.d.ts` (gerado), `mobile/.gitignore`

**Estimated scope:** S

---

## Task 15: `GET /api/v1/health`

**Description:** O app precisa saber se está online para escolher entre erro de rede e erro de
negócio. Endpoint público mínimo, sem dependências pesadas.

**Acceptance criteria:**
- [ ] `GET /api/v1/health` público → `200 {"status":"UP"}`
- [ ] Não toca o banco (responde mesmo com DB fora)
- [ ] Liberado explicitamente no `SecurityConfig`

**Verification:**
- [ ] Tests pass: `./mvnw -Dtest=HealthControllerTest test`
- [ ] Manual: `curl /api/v1/health` sem token → 200

**Dependencies:** None
**Files likely touched:**
- `common/HealthController.java` (novo), `config/security/SecurityConfig.java`

**Estimated scope:** S

---

## Task 16: Rate limiting no login

**Description:** Proteger `login` e `refresh` de força bruta sem introduzir infraestrutura externa.

**Acceptance criteria:**
- [ ] Limite por IP + e-mail em `login` (ex.: 5 falhas / 15 min)
- [ ] Excedido → `429` com `code` próprio e `Retry-After`
- [ ] Sucesso reseta o contador
- [ ] Limite configurável em `application.yaml`

**Verification:**
- [ ] Tests pass: `./mvnw -Dtest=AuthControllerTest test`
- [ ] Manual: 6 logins errados seguidos → 429 no sexto

**Dependencies:** Task 9 (para o `code`)
**Files likely touched:**
- `config/security/RateLimitFilter.java` (novo), `application.yaml`,
  `errors/ErrorResponse.java`, `config/security/SecurityConfig.java`

**Estimated scope:** M

---

## Task 17: CORS para Expo web

**Description:** Nativo não usa CORS, mas o projeto tem `react-native-web` e `web.output: "server"`.
Sem isso o alvo web morre silenciosamente.

**Acceptance criteria:**
- [ ] `CorsConfigurationSource` libera a origem do dev (`http://localhost:8081`) com `Authorization`
- [ ] Preflight `OPTIONS` responde `204`
- [ ] Em produção, origens vêm de configuração, não hardcoded

**Verification:**
- [ ] Tests pass: `./mvnw -Dtest=CorsConfigTest test`
- [ ] Manual: `curl -i -X OPTIONS -H "Origin: http://localhost:8081" ...` devolve os headers

**Dependencies:** Task 6
**Files likely touched:**
- `config/security/CorsConfig.java` (novo), `config/security/SecurityConfig.java`,
  `application.yaml`

**Estimated scope:** S

---

## Task 18: `DELETE /api/v1/users/me`

**Description:** Exclusão de conta exigida pelas lojas e pela LGPD. O comportamento precisa ser
decidido: apagar em cascata ou anonimizar preservando histórico agregado.

**Acceptance criteria:**
- [ ] `DELETE /api/v1/users/me` autenticado → `204`
- [ ] Dados pessoais removidos ou anonimizados conforme decisão registrada em ADR
- [ ] Refresh tokens do usuário revogados
- [ ] Segundo `DELETE` → `401` (sessão já não existe)

**Verification:**
- [ ] Tests pass: `./mvnw -Dtest=UserControllerTest test`
- [ ] Manual: criar usuário → criar sessão → DELETE → `GET /api/v1/users/me` 401

**Dependencies:** Tasks 5, 11
**Files likely touched:**
- `user/UserController.java`, `user/UserService.java`, `user/UserRepository.java`,
  `src/main/resources/db/migration/V11__*.sql` (se houver cascade/soft delete)
- `docs/adr/` (novo ADR)

**Estimated scope:** M

---

## Skills por fase

| Fase | Skills | Por quê |
|---|---|---|
| 1 (Tasks 1–5) | `security-and-hardening`, `api-and-interface-design`, `test-driven-development` | Token em header, storage, e 9 arquivos de teste para migrar |
| 2 (Task 6) | `security-and-hardening` | Sessão por dispositivo é decisão de segurança, não de schema |
| 3 (Tasks 7–8) | `api-and-interface-design`, `deprecation-and-migration` | Contrato versionado e o custo de remover `/api` sem alias |
| 4 (Tasks 9–10) | `api-and-interface-design`, `documentation-and-adrs` | Contrato de erro é ADR | 
| 5 (Tasks 11–12) | `test-driven-development` | Regra de fuso é testável isoladamente; sem skill de domínio no catálogo |
| 6 (Tasks 13–14) | `documentation-and-adrs`, `api-and-interface-design` | Contrato publicado e geração de tipos |
| 7 (Tasks 15–18) | `observability-and-instrumentation`, `security-and-hardening` | Health/rate limit/exclusão |
| Transversal | `incremental-implementation` (uma task por sessão), `code-review-and-quality` (antes de cada commit), `git-workflow-and-versioning` (branch por fase) | — |

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Migração Bearer quebra 9 arquivos de teste de uma vez | Alto | Tasks 3 e 4 separadas; Fase 1 fechada antes de qualquer outra coisa |
| `/v1` tocar 8 controllers + todos os testes no mesmo commit | Alto | Tasks 7 e 8 separadas; `grep` como verificação explícita |
| Remover `uk_refresh_tokens_user` permitir acúmulo infinito de tokens | Médio | Limpar por `expires_at` em job ou no próprio login; registrar em ADR |
| `code` de erro virar string mágica espalhada | Médio | Enum única em `errors/` e nada de literal no service |
| Fuso calculado no cliente e no servidor divergirem | Médio | Servidor é a fonte; `DashboardDto` declara o fuso usado |
| Rate limit em memória não sobrevive a múltiplas instâncias | Baixo (MVP single instance) | `shortcut:` no código; upgrade = Redis ou gateway |
| Exclusão de conta apagar histórico que o dashboard precisa | Médio | Decidir cascade vs anonimização em ADR **antes** da Task 18 |

## Open Questions

- Exclusão de conta: cascata total ou anonimização preservando agregados? (decide Task 18)
- `/v3/api-docs` fica público em produção ou só em perfil dev?
- Rate limit por IP funciona atrás de proxy? Precisa confiar em `X-Forwarded-For`?
