# Implementation Plan: Security — Autenticação com JWT (access + refresh)

## Overview

Implementar o pilar de autenticação do backend: cadastro de usuário, login, e fluxo de dois tokens — um **access token JWT de 15 minutos** dentro de cookie HttpOnly, usado em toda requisição, e um **refresh token opaco (6 meses)** persistido com hash no banco. Access token inválido/expirado → a API responde `401` (silencioso para o usuário); o cliente então chama `POST /api/auth/refresh`, que valida o refresh token no banco via JPQL, emite novo access token no cookie, e o cliente repete a requisição original. Qualquer falha em qualquer etapa → `401`.

Também inclui: DTOs de criação/atualização de usuário, DTO-projeção (interface projection com JPQL explícito) para dados resumidos, e um endpoint protegido `GET /api/users/me` que expõe a projeção e serve de alvo para validar o fluxo.

## Decisões de arquitetura

- **Refresh é acionado pelo cliente (decisão do usuário):** o filtro NÃO refaz a requisição internamente. `401` → cliente chama `/api/auth/refresh` → repete a chamada original.
- **Refresh token opaco (decisão do usuário):** `SecureRandom` 32 bytes (base64url), armazenado como hash SHA-256 hex na tabela `refresh_tokens`, com `expires_at` (6 meses). Validação e expiração em uma query JPQL só. Sem JWT para refresh.
- **JWT library: Nimbus via `spring-boot-starter-security-oauth2-resource-server`** (nome gerenciado pelo parent Boot 4.1.1, sem versão no pom). Usamos `NimbusJwtEncoder`/`NimbusJwtDecoder` manualmente com HMAC (HS256) a partir do `spring.jwt.secret` já existente. Alternativa descartada: jjwt (artefatos de terceiro sem versionamento gerenciado pelo Boot).
- **Um refresh token ativo por usuário:** login sobrescreve a linha (`uk_refresh_tokens_user`), evitando rotação/lote de sessões. shortcut: sem revogação multi-dispositivo; upgrade = uma linha por sessão.
- **CSRF desabilitado (já está hoje):** cookies `SameSite=Lax` bloqueiam cross-site POST. shortcut: se um dia servir cookies para terceiros, ativar CSRF tokens.
- **401 fora do MVC:** o filtro de segurança não passa pelo `GlobalExceptionHandler`, então o `AuthenticationEntryPoint` escreve o JSON de `ErrorResponse` (mesmo shape do restante do sistema).
- **Estrutura por feature (padrão do repo):** `user/` (entidade, DTOs, mapper, service, controller), `auth/` (controller, service, DTO de login), `config/jwt/` (JwtService + JwtProperties), `config/security/` (SecurityConfig + filtro).
- **Usuário sem papéis (roles)** — todos os autenticados têm o mesmo acesso (heurística do `permitAll` atual). Escala = adicionar tabela/coluna de roles.

## Fluxo (sequência)

```
register ── POST /api/auth/register (público) ──> 201 UserDto
login    ── POST /api/auth/login    (público) ──> 200 + Set-Cookie access_token (15min, HttpOnly, Path=/)
                                                  + Set-Cookie refresh_token (6m, HttpOnly, Path=/api/auth)
requisição protegida
  ├─ cookie access_token válido     ──> SecurityContext ──> 200
  └─ inválido/expirado/ausente      ──> 401 (ErrorResponse JSON)   ← silencioso p/ o usuário
cliente (em silêncio)
  └─ POST /api/auth/refresh (cookie refresh_token)
       ├─ JPQL: SELECT rt FROM RefreshToken rt WHERE rt.tokenHash = :hash AND rt.expiresAt > :now
       ├─ válido     ──> novo access_token no cookie ──> 200 ──> cliente repete a requisição ──> 200
       └─ inválido   ──> 401
```

## Task List

### Fase 1: Fundação (schema + domínio de usuário)
- [x] Task 1: Migration `V2__users.sql` + entidades `User`/`RefreshToken` + repositórios
- [x] Task 2: DTOs (`CreateUserDto`, `UpdateUserDto`, `UserDto`), interface projection + JPQL explícito, mapper MapStruct, `UserService` + testes unitários

**Checkpoint Fase 1**
- [x] `./mvnw test` verde; app sobe e Flyway aplica V2 no banco local (`flyway_schema_history` com 2 linhas)

### Fase 2: Tokens (JWT + cookies)
- [x] Task 3: `JwtService` (emitir/validar access token HS256) + propriedades (`spring.jwt.expiration-ms=900000`, `refresh-expiration-ms=15552000000`) + teste unitário
- [x] Task 4: `AuthService` (register/login, encoder, hash do refresh, cookies) + `POST /api/auth/register` e `POST /api/auth/login` + teste MockMvc

### Fase 3: Proteção + endpoint de dados resumidos
- [x] Task 5: `JwtAuthenticationFilter` + `SecurityConfig` (rotas públicas/privadas, stateless, 401 JSON) + `UserController` (`GET/PUT /api/users/me`) + teste MockMvc

**Checkpoint Fase 3**
- [x] `./mvnw test` verde; `GET /api/users/me` sem cookie → 401; com access token → 200 com dados resumidos

### Fase 4: Refresh
- [x] Task 6: `POST /api/auth/refresh` (query JPQL de validação, novo cookie) + testes de válido/expirado/ausente

### Fase 5: Verificação ponta a ponta
- [x] Task 7: `AuthFlowIT` cobrindo o fluxo completo (register → login → 401 → refresh → retry → 200 → refresh expirado → 401)

**Checkpoint Final**
- [x] `./mvnw test` (suíte completa) verde
- [ ] Todos os critérios de aceite marcados; revisão humana

## Riscos e Mitigações

| Risco | Impacto | Mitigação |
|------|---------|-----------|
| Starter do Nimbus não está no `.m2` local | Build baixa dependências novas | Rede/Maven Central verificados como acessíveis; nome confirmado no pom do Boot 4.1.0 |
| 401 gerado no filtro não passa pelo `@RestControllerAdvice` | Corpo 401 divergir do resto da API | `AuthenticationEntryPoint` dedicado escrevendo o `ErrorResponse` existente |
| Testes usam Testcontainers (Docker) | Suíte falha sem Docker | Docker já presente e em execução no ambiente |
| CSRF desabilitado com cookie em estado alterante | Superfície de CSRF | `SameSite=Lax` + `HttpOnly`; documentado como shortcut no `SecurityConfig` |
| Cookie `Secure` não pode ser usado em `http://localhost` | Login quebrado em dev | Não setar `Secure` nesta iteração; fazer quando houver TLS/prod |
| Corpo da senha/log ajam em log | Vazamento | Nunca logar `LoginDto`/senha; o `LoggingAspect` atual só loga anotação `@Logging` |

## Open Questions (não bloqueiam)
- **CORS:** o frontend Next roda em outra origem (ex.: `:3000`) — cookies exigem `allowCredentials` + origem exata, ou proxy no Next. Confirmar como o frontend chama a API antes de integrar.
- **Logout / revogação:** não pedido; a linha `refresh_tokens` permite revogar depois (DELETE /api/auth/logout).
- **Rotação do refresh token:** não pedido; upgrade recomendável quando houver multi-sessão.
- **Troca de senha / forgot password:** fora de escopo.
- `UpdateUserDto` cobre `name`/`email`; mudança de senha fica para depois (nomear: não implementado).

## Dependência entre tasks
`T1 → T2 → (T3 ‖ T2) → T4 → T5 → T6 → T7` — T1 é raiz; T3 (`JwtService`) só depende do segredo em config e é paralelizável com T2; T4 depende de T2 (DTOs/usuário) e T3 (token); T5 depende de T4; T6/T7 dependem de T5.
