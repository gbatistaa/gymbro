# Tasks — Fluxo de Security (JWT access + refresh)

Ordem de execução: 1 → 2 → 3 → 4 → 5 → 6 → 7 (T3 pode correr em paralelo com T2).
Comandos de verificação: focada `./mvnw -Dtest=<Teste> test`; suíte completa `./mvnw test`.

---

## Task 1: Migration + entidades User/RefreshToken + repositórios

**Description:** Criar o schema do domínio de autenticação (tabelas `users` e `refresh_tokens`) via Flyway `V2__users.sql`, as entidades JPA seguindo o padrão `BaseEntity`/`exercise` e os repositórios Spring Data.

**Acceptance criteria:**
- [x] `V2__users.sql` cria `users` (id UUID PK, created_at, updated_at, name, email UNIQUE NOT NULL, password_hash NOT NULL) e `refresh_tokens` (id UUID PK, created_at, updated_at, token_hash VARCHAR(64) NOT NULL, expires_at TIMESTAMPTZ NOT NULL, user_id UUID NOT NULL UNIQUE FK → users)
- [x] `User extends BaseEntity` com `name`, `email` (`@Column(unique=true, nullable=false)`), `passwordHash`; `RefreshToken extends BaseEntity` com `tokenHash`, `expiresAt`, `user` (`@ManyToOne`, `user_id` unique)
- [x] `UserRepository extends JpaRepository<User, UUID>` com `existsByEmail(String)`; `RefreshTokenRepository extends JpaRepository<RefreshToken, UUID>`

**Verification:**
- [x] Tests pass: `./mvnw -o test` (4 testes, verde)
- [x] Build succeeds: `./mvnw -q -o compile`
- [x] Manual check: subir app → `flyway_schema_history` com 2 linhas (`1|init|t`, `2|users|t`) e tabelas `users`/`refresh_tokens` existentes no banco `gymbro`

**Dependencies:** None

**Files likely touched:**
- `src/main/resources/db/migration/V2__users.sql`
- `src/main/java/com/gbatistadev/gymbro/user/User.java`
- `src/main/java/com/gbatistadev/gymbro/user/RefreshToken.java`
- `src/main/java/com/gbatistadev/gymbro/user/UserRepository.java`
- `src/main/java/com/gbatistadev/gymbro/user/RefreshTokenRepository.java`

**Estimated scope:** M (5 arquivos, 1 SQL)

---

## Task 2: DTOs de usuário + interface projection com JPQL explícito + UserService

**Description:** Implementar os DTOs de criação e atualização de usuário, o mapper MapStruct, a projeção de interface para dados resumidos com query JPQL explícita no repositório, e o `UserService` (criar com e-mail único, update parcial), coberto por testes unitários estilo `ExerciseServiceTest`.

**Acceptance criteria:**
- [x] `CreateUserDto(name, email, password)` com validação (`@NotBlank`, `@Email`, `@Size(min=8)`); `UpdateUserDto(name?, email?)` (atualização parcial, sem senha); `UserDto(id, createdAt, updatedAt, name, email)`
- [x] Interface `UserSummaryProjection` (`getId`, `getName`, `getEmail`, `getCreatedAt`) + `@Query` JPQL explícito `SELECT u.id AS id, u.name AS name, u.email AS email, u.createdAt AS createdAt FROM User u WHERE u.id = :id` retornando `Optional<UserSummaryProjection>`
- [x] `UserService.create` lança `ResourceAlreadyExistsException` (409) se `existsByEmail`; `UserService.update` aplica só campos não nulos e lança `NotFoundException` se id não existir; senha é criptografada com `BCryptPasswordEncoder` ao criar
- [x] Testes: criação OK, e-mail duplicado → exceção, update parcial preserva campos não enviados, inexistente → `NotFoundException`

**Verification:**
- [x] Tests pass: `./mvnw -Dtest=UserServiceTest test`
- [x] Build succeeds: `./mvnw -q compile`
- [x] Manual check: nenhum endpoint novo ainda (TDD: testes verdes na camada de serviço)

**Dependencies:** Task 1

**Files likely touched:**
- `src/main/java/com/gbatistadev/gymbro/user/dto/CreateUserDto.java`
- `src/main/java/com/gbatistadev/gymbro/user/dto/UpdateUserDto.java`
- `src/main/java/com/gbatistadev/gymbro/user/dto/UserDto.java`
- `src/main/java/com/gbatistadev/gymbro/user/UserSummaryProjection.java`
- `src/main/java/com/gbatistadev/gymbro/user/UserMapper.java`
- `src/main/java/com/gbatistadev/gymbro/user/UserService.java`
- `src/test/java/com/gbatistadev/gymbro/user/UserServiceTest.java`

**Estimated scope:** M (6-7 arquivos)

---

## Task 3: JwtService (emitir/validar access token de 15 min)

**Description:** Adicionar o starter de resource-server para obter Nimbus (versão gerenciada pelo Boot), criar `JwtService` com HMAC HS256 usando o `spring.jwt.secret` existente, e ajustar as propriedades: access token 15 min, expiração do refresh 6 meses.

**Acceptance criteria:**
- [x] `pom.xml` ganha `spring-boot-starter-security-oauth2-resource-server` (sem `<version>`)
- [x] `application.yaml`: `spring.jwt.expiration-ms: 900000` (15 min) e `spring.jwt.refresh-expiration-ms: 15552000000` (6 meses — corrigido de 1555200000, que eram 18 dias); `JwtProperties` ganha o componente `refreshExpirationMs`
- [x] `JwtService.createAccessToken(UUID userId, String email)` emite JWT HS256 com `sub`=id, `email`, `exp` = 15 min; `JwtService.parseAccessToken(String)` devolve o `UUID` do usuário ou falha para token inválido/expirado/trocado
- [x] Testes: roundtrip ida-e-volta do id; token adulterado/expirado → inválido

**Verification:**
- [x] Tests pass: `./mvnw -Dtest=JwtServiceTest test`
- [x] Build succeeds: `./mvnw -q compile`
- [x] Manual check: nenhum (unidade pura + config)

**Dependencies:** None (paralelizável com Task 2)

**Files likely touched:**
- `pom.xml`
- `src/main/resources/application.yaml`
- `src/main/java/com/gbatistadev/gymbro/config/jwt/JwtProperties.java`
- `src/main/java/com/gbatistadev/gymbro/config/jwt/JwtService.java`
- `src/test/java/com/gbatistadev/gymbro/config/jwt/JwtServiceTest.java`

**Estimated scope:** S (4-5 arquivos)

---

## Task 4: AuthService — register/login com cookies HttpOnly

**Description:** Implementar o serviço de autenticação (verificação de credenciais, geração e persistência do refresh token opaco com hash SHA-256 e expiração de 6 meses, emissão dos cookies HttpOnly) e os endpoints públicos de cadastro e login.

**Acceptance criteria:**
- [x] `POST /api/auth/register` recebe `CreateUserDto`, reutiliza `UserService.create`, devolve `201` + `UserDto`
- [x] `POST /api/auth/login` recebe `LoginDto(email, password)`; credencial inválida → `UnauthorizedException` → `401` com o `ErrorResponse` existente
- [x] Login válido: sobrescreve a linha `refresh_tokens` do usuário (token opaco 32 bytes base64url, armazenado como hash SHA-256 hex, `expires_at` = agora + 6 meses) e devolve `200` + `UserDto` com dois `Set-Cookie`: `access_token` (Max-Age 900, HttpOnly, Path=/, SameSite=Lax) e `refresh_token` (Max-Age 15552000, HttpOnly, Path=/api/auth, SameSite=Lax)
- [x] Teste MockMvc: register → login → cookies presentes com os atributos corretos; senha errada → 401

**Verification:**
- [x] Tests pass: `./mvnw -Dtest=AuthControllerTest test`
- [x] Build succeeds: `./mvnw -q compile`
- [x] Manual check: `curl -i -X POST /api/auth/login` mostra os dois `Set-Cookie` com `HttpOnly` (verificado com app rodando: 200 + access Max-Age=900 Path=/ e refresh Max-Age=15552000 Path=/api/auth; `refresh_tokens.token_hash` = 64 hex, `expires_at` = +6 meses)

**Dependencies:** Tasks 2, 3

**Files likely touched:**
- `src/main/java/com/gbatistadev/gymbro/auth/AuthController.java`
- `src/main/java/com/gbatistadev/gymbro/auth/AuthService.java`
- `src/main/java/com/gbatistadev/gymbro/auth/dto/LoginDto.java`
- `src/test/java/com/gbatistadev/gymbro/auth/AuthControllerTest.java`

**Estimated scope:** S (4 arquivos)

---

## Task 5: Filtro JWT + SecurityConfig + endpoint de dados resumidos

**Description:** Proteger as rotas: filtro que lê o cookie `access_token` e autentica; `SecurityConfig` com rotas públicas só de auth, sessão stateless e `AuthenticationEntryPoint` que devolve o 401 no shape padrão; `UserController` expondo a projeção de dados resumidos em `GET /api/users/me` (protegido) e o update em `PUT /api/users/me`.

**Acceptance criteria:**
- [x] `JwtAuthenticationFilter` (antes de `UsernamePasswordAuthenticationFilter`): sem cookie/inválido/expirado → segue sem autenticação (Spring responde 401); válido → `SecurityContext` com principal = id do usuário
- [x] `SecurityConfig`: `/api/auth/**` permitAll, demais rotas autenticadas, sessão STATELESS, csrf desabilitado (comentário `shortcut:`), `exceptionHandling` com `AuthenticationEntryPoint` escrevendo `ErrorResponse` JSON `401`
- [x] `GET /api/users/me` → `200` com `UserSummaryProjection` (JPQL de Task 2) usando o id do `SecurityContext`; `PUT /api/users/me` recebe `UpdateUserDto` → `200` + `UserDto`
- [x] Teste MockMvc: sem cookie → 401 JSON (status/error/message/path); com access token → 200 com `{id, name, email, createdAt}`; PUT altera os campos

**Verification:**
- [x] Tests pass: `./mvnw -Dtest=UserControllerTest test`
- [x] Build succeeds: `./mvnw test` (suíte completa, sem regressões)
- [x] Proteção confirmada por MockMvc: `GET /api/exercises` sem cookie → 401; `GET /api/users/me` com cookie válido → 200

**Dependencies:** Tasks 3, 4

**Files likely touched:**
- `src/main/java/com/gbatistadev/gymbro/config/security/JwtAuthenticationFilter.java`
- `src/main/java/com/gbatistadev/gymbro/config/security/SecurityConfig.java` (edição)
- `src/main/java/com/gbatistadev/gymbro/user/UserController.java`
- `src/test/java/com/gbatistadev/gymbro/user/UserControllerTest.java`

**Estimated scope:** M (4 arquivos)

**Checkpoint após Task 5**
- [x] Suíte verde; `GET /api/users/me` sem cookie → 401; com access token → 200

---

## Task 6: POST /api/auth/refresh

**Description:** Endpoint de renovação: valida o refresh token no banco via JPQL (hash + não expirado) e emite novo access token no cookie. Qualquer falha → 401.

**Acceptance criteria:**
- [x] `POST /api/auth/refresh` lê o cookie `refresh_token`, calcula o SHA-256 hex e consulta `@Query("SELECT rt FROM RefreshToken rt WHERE rt.tokenHash = :hash AND rt.expiresAt > :now")` (com o usuário já resolvido)
- [x] Válido → `Set-Cookie` novo `access_token` (15 min, HttpOnly) e `200` com `UserDto`
- [x] Cookie ausente, hash não encontrado ou `expires_at` no passado → `401` com `ErrorResponse`
- [x] Testes: fluxo OK (novo cookie autentica em `/api/users/me`), refresh expirado (grava `expires_at` no passado) → 401, sem cookie → 401

**Verification:**
- [x] Tests pass: `./mvnw -Dtest=AuthControllerTest test` (7 testes)
- [x] Build succeeds: `./mvnw test` (suíte 25/25)
- [x] Manual check contra o Supabase real: register 201 → login 200 → `/me` sem cookie 401 → `/me` com access 200 → refresh 200 → `/me` com access novo 200 → `expires_at` no passado (UPDATE no banco) → refresh 401 `ErrorResponse`

**Dependencies:** Task 5

**Files likely touched:**
- `src/main/java/com/gbatistadev/gymbro/auth/AuthController.java` (edição)
- `src/main/java/com/gbatistadev/gymbro/auth/AuthService.java` (edição)
- `src/main/java/com/gbatistadev/gymbro/user/RefreshTokenRepository.java`
- `src/test/java/com/gbatistadev/gymbro/auth/AuthControllerTest.java` (edição)

**Estimated scope:** S (3-4 arquivos)

---

## Task 7: Teste ponta a ponta do fluxo (AuthFlowIT)

**Description:** Um único teste de integração (@SpringBootTest + Testcontainers, padrão do repo) que prova a história completa do usuário.

**Acceptance criteria:**
- [x] Fluxo: register → login → `GET /api/users/me` com access cookie → 200 com dados resumidos
- [x] Sem access cookie → 401 com corpo `ErrorResponse` (status `401`, path `/api/users/me`); `POST /api/auth/refresh` com refresh cookie → novo access cookie → repetir `GET` → 200
- [x] Refresh com `expires_at` no passado → 401

**Verification:**
- [x] Tests pass: `./mvnw -Dtest=AuthFlowIT test` (2 testes)
- [x] Build succeeds: `./mvnw test` (suíte completa 27/27 — surefire configurado pra incluir `*IT`)
- [x] Manual check: nenhum adicional (o teste É a evidência)

**Dependencies:** Task 6

**Files likely touched:**
- `src/test/java/com/gbatistadev/gymbro/auth/AuthFlowIT.java`

**Estimated scope:** S (1 arquivo)

---

## Checkpoint Final
- [x] `./mvnw test` verde (suíte completa — 27/27)
- [x] Todos os critérios de aceite acima marcados
- [ ] Revisão humana (CORS, logout, rotação de refresh — ver Open Questions do `tasks/plan.md`)
