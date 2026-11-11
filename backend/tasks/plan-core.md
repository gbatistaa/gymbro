# Plano de implementação — Núcleo do Gymbro (5 macro-tasks)

> Continua `tasks/plan.md` (auth, concluído). Não substitui nada existente.
> Base: estado real do repo em 2026-11-09 — auth JWT pronta; `exercises` com CRUD;
> `playlists`, `workout_session`, `workout_log`, `bioimpedance` só com entidade/schema, sem API.

## Premissas e decisões de fundação

| # | Decisão | Justificativa |
|---|---|---|
| D1 | `user_id` em `playlists`, `workout_session`, `bioimpedance`; `workout_log` e `playlist_exercise` herdam o dono via pai | Fonte única de verdade; evita divergência de dono em tabelas filhas |
| D2 | Todo acesso por id passa por `findByIdAndUserId`; recurso de outro usuário → **404** (não 403) | Evita enumeração de ids; 403 revela existência |
| D3 | Catálogo de exercícios **global** (seed) + exercícios customizados por usuário (`user_id` nullable, null = sistema) | Catálogo compartilhado é o valor; custom não polui o global |
| D4 | Sessão pode ser **livre** (`playlist_id` nullable) ou baseada em rotina | Treino avulso é comum; exigir rotina cria atrito |
| D5 | `workout_log.id` é **UUID gerado no cliente**; reenvio do mesmo id = idempotente | Resolve offline/retry sem tabela de idempotência |
| D6 | `is_pr` = PR de **1RM estimado** (Epley), calculado no servidor, imutável depois de gravado | Um booleano só; e1RM captura carga×reps. PR de carga pura pode virar coluna depois |
| D7 | Tempo: migrar `started_at`/`measured_at` para `timestamptz` e tratar tudo em UTC | `TIMESTAMP WITHOUT TIME ZONE` quebra semana/dia em fuso America/Sao_Paulo |
| D8 | PDF de bioimpedância **não é parseado no Java**; o parser é um contrato JSON separado | Parsing de PDF/OCR é outro runtime; Java só recebe dados normalizados |
| D9 | API continua em `/api/...` (sem `/v1`) | Consistência com o que já existe; versionar é decisão separada |

## Mapa de dependências

```
T1 (ownership)
 ├── T2 (execução de treino)  ← entrega valor sozinho (sessão livre)
 │     └── T5 (analytics/progressão)
 ├── T3 (rotinas + catálogo) ─┘
 └── T4 (bioimpedância) ──────┘
```

Ordem recomendada: **T1 → T2 → T3 → T4 → T5**.
T4 pode rodar em paralelo com T2/T3 (não compartilha tabela). T5 é o único que depende dos quatro.

---

## Task 1 — Fundação multi-tenant (ownership)

**Objetivo:** nenhum dado acessível sem dono. Custo baixo agora, reescrita caríssima depois.

### Schema — `V3__ownership.sql`

```sql
ALTER TABLE playlists        ADD COLUMN user_id UUID;
ALTER TABLE workout_session  ADD COLUMN user_id UUID;
ALTER TABLE bioimpedance     ADD COLUMN user_id UUID;

-- dev: não há dados de produção. TRUNCATE explícito em vez de backfill fictício.
-- (Se houver dados locais que importam, criar usuário seed e UPDATE antes do NOT NULL.)
TRUNCATE workout_log, workout_session, playlist_exercise, playlists, bioimpedance, bioimpedance_log CASCADE;

ALTER TABLE playlists        ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE workout_session  ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE bioimpedance     ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE playlists        ADD CONSTRAINT fk_playlists_user        FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE workout_session  ADD CONSTRAINT fk_sessions_user         FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE bioimpedance     ADD CONSTRAINT fk_bioimpedance_user     FOREIGN KEY (user_id) REFERENCES users(id);

CREATE INDEX ix_playlists_user          ON playlists(user_id);
CREATE INDEX ix_sessions_user_started   ON workout_session(user_id, started_at DESC);
CREATE INDEX ix_bio_user_measured       ON bioimpedance(user_id, measured_at DESC);
CREATE INDEX ix_workout_log_session     ON workout_log(workout_session_id);
CREATE INDEX ix_workout_log_exercise    ON workout_log(exercise_id);
```

> FK no Postgres **não cria índice**. Sem `ix_workout_log_exercise`, toda estatística por exercício faz seq scan.

### O que codar

- `common/security/CurrentUser.java` — componente que lê `SecurityContextHolder` e devolve `UUID`; lança `UnauthorizedException` se vazio. O filtro já coloca o `userId` como principal.
- `User` ganha `@OneToMany`? **Não.** Associação unidirecional `@ManyToOne(fetch = LAZY, optional = false)` nas três entidades. Evita ciclo e lazy loading acidental.
- Repositórios: `Optional<Playlist> findByIdAndUserId(UUID id, UUID userId)`, `Page<WorkoutSession> findAllByUserIdAndStartedAtBetween(...)`, `Optional<Bioimpedance> findByIdAndUserId(...)`. Nunca `findById` em service.
- Trocar todo `findById`/`deleteById` dos controllers/services existentes de exercício por versão escopada (o CRUD de exercício hoje é global — ver D3: leitura global, escrita só em custom).
- `exercises`: `user_id UUID NULL` + índices parciais de unicidade:
  ```sql
  ALTER TABLE exercises ADD COLUMN user_id UUID REFERENCES users(id);
  ALTER TABLE exercises ADD COLUMN name_normalized VARCHAR(255);
  CREATE UNIQUE INDEX ux_exercises_global_name ON exercises(name_normalized) WHERE user_id IS NULL;
  CREATE UNIQUE INDEX ux_exercises_user_name   ON exercises(user_id, name_normalized) WHERE user_id IS NOT NULL;
  ```
  `name_normalized` gerado no app (lowercase + strip acentos) para deduplicar "Supino reto" vs "supino reto ".

### Critérios de aceite

- [ ] Login de A não enxerga playlist/sessão/bioimpedância de B (404).
- [ ] `GET /api/exercises` devolve globais + custom do usuário; `PUT/DELETE` de exercício global → 403/404.
- [ ] `TRUNCATE`/backfill documentado e aplicado; Flyway `V3` verde.
- [ ] Teste de integração de isolamento com 2 usuários.

**Escopo:** M (6–8 arquivos + 1 migration).

---

## Task 2 — Núcleo de execução de treino (o coração)

**Objetivo:** registrar série, calcular volume, detectar PR, retomar sessão. Sem isso, T5 não tem dado.

### Schema — `V4__session_core.sql`

```sql
ALTER TABLE workout_session
  ADD COLUMN status      VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
  ADD COLUMN notes       TEXT,
  ADD COLUMN version     BIGINT      NOT NULL DEFAULT 0,
  ALTER COLUMN ended_at   DROP NOT NULL,
  ALTER COLUMN playlist_id DROP NOT NULL;

ALTER TABLE workout_session
  ALTER COLUMN started_at TYPE timestamptz USING started_at AT TIME ZONE 'UTC';

ALTER TABLE workout_log
  ADD COLUMN rpe   SMALLINT CHECK (rpe BETWEEN 1 AND 10),
  ADD COLUMN notes TEXT;

ALTER TABLE workout_log
  ADD CONSTRAINT uk_log_set UNIQUE (workout_session_id, exercise_id, set_number);

-- uma sessão aberta por usuário
CREATE UNIQUE INDEX ux_session_open ON workout_session(user_id) WHERE status = 'IN_PROGRESS';
```

Observações:
- `ended_at` nullable + `status` elimina a gambiarra de data sentinela.
- `version` (`@Version` na entidade) evita lost update quando dois dispositivos mexem na mesma sessão.
- `set_number` pode ser calculado no servidor (`max + 1`) ou enviado; constraint protege contra duplicata.

### O que codar

**Entidades/enums**
- `workout_session/SessionStatus.java` — `IN_PROGRESS`, `FINISHED`, `ABANDONED`.
- `WorkoutSession`: `status`, `endedAt` nullable, `playlist` nullable, `notes`, `@Version`.
- `WorkoutLog`: `rpe`, `notes`; id aceito do cliente (não `@GeneratedValue` — `@Id` simples).

**Endpoints**

| Método | Rota | Regra |
|---|---|---|
| `POST` | `/api/sessions` | body `{playlistId?, startedAt?}`; 409 se já existe `IN_PROGRESS` (devolve `sessionId` no erro) |
| `GET` | `/api/sessions/active` | 200 com a sessão aberta ou 204 |
| `POST` | `/api/sessions/{id}/logs` | body `{id, exerciseId, weight, reps, rpe?, setNumber?}`; recalcula volume e `is_pr` na mesma transação |
| `DELETE` | `/api/sessions/{id}/logs/{logId}` | apaga + recalcula volume; não “desmarca” PR histórico |
| `PATCH` | `/api/sessions/{id}` | `{status: FINISHED\|ABANDONED}`; FINISHED exige ≥1 log |
| `GET` | `/api/sessions?from&to&playlistId&page&size` | ordenado por `startedAt desc` |
| `GET` | `/api/sessions/{id}` | logs agrupados por exercício (`JOIN FETCH`, sem N+1) |

**Regras de negócio**
- `total_volume = Σ(weight × reps)` recalculado **do zero** a partir dos logs ao encerrar (não confiar em incremento).
- `weight ≥ 0` (0 para peso corporal), `reps ≥ 1`, `setNumber ≥ 1`.
- Epley: `e1rm = weight × (1 + reps / 30.0)`. `reps = 1` → `weight`.
- PR: `max(e1rm)` do mesmo `userId + exerciseId` em **outras** sessões com `started_at` anterior. `is_pr = candidato > max`. Empate não é PR.
- Log com `id` já existente: se pertence à mesma sessão → 200 com o log existente (idempotente); se é de outra sessão → 409.
- Sessão de outro usuário → 404. Sessão `FINISHED` não aceita novos logs → 409.
- `startedAt` default = `now()`. Rejeitar `startedAt` no futuro > 5 min.

**Armadilhas**
- Volume com peso corporal fica 0 — documentar; não inventar fator de peso sem dado.
- Deletar log não deve reescrever PRs antigos: PR é fato histórico.
- `@Version` + recálculo: se conflitar, devolver 409 e deixar o cliente recarregar; não fazer retry automático.

### Critérios de aceite

- [ ] Fluxo: abrir → 3 logs → encerrar → `total_volume` correto; sessão fechada rejeita log.
- [ ] Reenvio do mesmo log (mesmo UUID) não duplica e devolve 200.
- [ ] PR detectado no servidor no primeiro log que supera e1RM histórico; `is_pr=false` nos demais.
- [ ] Duas sessões abertas simultâneas para o mesmo usuário → a segunda recebe 409.
- [ ] `GET /sessions` de A não lista sessão de B.

**Escopo:** L (10–14 arquivos: 2 entidades, enum, 4 DTOs, service, controller, repos, testes). Se passar disso, dividir em 2 tasks (sessão / logs+PR).

---

## Task 3 — Rotinas e catálogo (CRUD + ordenação + alvos)

**Objetivo:** estruturar o que será executado e dar insumo para a progressão.

### Schema — `V5__routines.sql`

```sql
ALTER TABLE playlists
  ADD COLUMN description TEXT,
  ADD COLUMN archived_at timestamptz;

ALTER TABLE playlist_exercise
  ADD COLUMN target_reps_min INTEGER,
  ADD COLUMN target_reps_max INTEGER,
  ADD COLUMN rest_seconds    INTEGER,
  ADD COLUMN note            TEXT,
  ADD CONSTRAINT ck_reps_range CHECK (target_reps_min IS NULL OR target_reps_max IS NULL
         OR target_reps_min <= target_reps_max),
  ADD CONSTRAINT ck_rest CHECK (rest_seconds IS NULL OR rest_seconds BETWEEN 0 AND 600);

-- permite reordenar em um único UPDATE
ALTER TABLE playlist_exercise
  ADD CONSTRAINT uk_playlist_order UNIQUE (playlist_id, order_index)
  DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE exercises
  ALTER COLUMN secondary_muscle DROP NOT NULL,
  ADD COLUMN equipment      VARCHAR(50),
  ADD COLUMN increment_kg   NUMERIC(5,2) DEFAULT 2.5,
  ADD COLUMN is_archived    BOOLEAN NOT NULL DEFAULT FALSE;
```

Seed: `R__seed_exercises.sql` (repeatable) com ~60–100 exercícios, `user_id = NULL`, `name_normalized` preenchido. Repeatable roda de novo quando o checksum muda — adequado a catálogo versionado no repo.

### Endpoints

| Método | Rota | Regra |
|---|---|---|
| `GET` | `/api/exercises?q&muscle&includeArchived&page&size` | `ILIKE '%'||:q||'%'` em `name_normalized`; globais + custom do usuário |
| `POST` | `/api/exercises` | cria custom do usuário; 409 se nome normalizado duplicado |
| `PUT` | `/api/exercises/{id}` | só custom do próprio usuário |
| `DELETE` | `/api/exercises/{id}` | arquiva; 409 se usado em rotina ativa ou log |
| `GET/POST` | `/api/playlists` | lista ignora arquivadas por padrão |
| `GET` | `/api/playlists/{id}` | itens ordenados + dados do exercício (`JOIN FETCH`) |
| `PUT` | `/api/playlists/{id}` | nome/descrição |
| `POST` | `/api/playlists/{id}/clone` | copia itens com mesma ordem/alvos |
| `POST` | `/api/playlists/{id}/archive` | idempotente |
| `POST` | `/api/playlists/{id}/exercises` | `{exerciseId, targetSets, targetRepsMin?, targetRepsMax?, restSeconds?}` |
| `PATCH` | `/api/playlists/{id}/exercises/{peId}` | edita alvos |
| `DELETE` | `/api/playlists/{id}/exercises/{peId}` | remove e reindexa |
| `PUT` | `/api/playlists/{id}/order` | body `{items: [{playlistExerciseId, orderIndex}]}` em uma transação |

**Regras**
- Ordem sempre contígua `0..n-1`; validar que o conjunto enviado é exatamente o atual.
- `order_index` único é `DEFERRABLE` para permitir um `UPDATE` único sem violar no meio do caminho (ou usar valores temporários negativos).
- Não permitir deletar playlist com sessões (FK): 409 → arquivar.
- Clone: nomes iguais são permitidos (não criar unique em `playlists.name`).
- Exercício global não pode ser editado/arquivado pelo usuário; só custom.
- Busca: para escala pessoal, `ILIKE` resolve. **Não** instalar `pg_trgm` agora.

### Critérios de aceite

- [ ] Criar rotina com 4 exercícios, reordenar 4→1 em uma chamada, ordem persistida `0..3`.
- [ ] Clone preserva ordem e alvos.
- [ ] Duplicar exercício com acento/caixa → 409 com mensagem “já existe”.
- [ ] Arquivar exercício usado em rotina ativa → 409.
- [ ] `GET /api/playlists` de A não vê playlists de B.

**Escopo:** L (12–16 arquivos). Dividir em “catálogo” e “rotinas” se necessário.

---

## Task 4 — Ingestão de bioimpedância

**Objetivo:** transformar relatório de balança em série temporal confiável, com dedupe e auditoria.

### Decisão de arquitetura (D8)

| Opção | Custo | Risco | Veredito |
|---|---|---|---|
| A. Parser PDF no backend Java (PDFBox + regex/LLM) | alto | formato de laudo muda, OCR ruim, acopla runtime | não |
| B. Sidecar Python (FastAPI + docling, já prototipado) chamado pelo Java | médio | mais um processo para subir | recomendado **quando** houver upload in-app |
| C. Importador offline: script Python gera JSON → `POST /api/bioimpedance/import` | baixo | manual, mas é ferramenta pessoal | recomendado **agora** |

O contrato é o mesmo nas três: **JSON normalizado**. O backend nunca conhece PDF.

### Schema — `V6__bioimpedance_import.sql`

```sql
ALTER TABLE bioimpedance
  ALTER COLUMN visceral_fat      DROP NOT NULL,
  ALTER COLUMN water_percentage  DROP NOT NULL,
  ADD COLUMN user_id UUID,
  ADD COLUMN body_weight_kg NUMERIC(5,2),
  ADD COLUMN height_cm      NUMERIC(5,1),
  ADD COLUMN skeletal_muscle_mass_kg NUMERIC(5,2),
  ADD COLUMN source         VARCHAR(30) NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN source_file_hash VARCHAR(64);

ALTER TABLE bioimpedance ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE bioimpedance ADD CONSTRAINT fk_bioimpedance_user2 FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE bioimpedance ALTER COLUMN measured_at TYPE timestamptz USING measured_at AT TIME ZONE 'UTC';

CREATE UNIQUE INDEX ux_bio_user_measured ON bioimpedance(user_id, measured_at);
CREATE UNIQUE INDEX ux_bio_user_hash     ON bioimpedance(user_id, source_file_hash)
  WHERE source_file_hash IS NOT NULL;
```

> As métricas atuais são `NOT NULL`; uma balança que não mede visceral faria o insert falhar. Tornar `visceral_fat`/`water_percentage` opcionais é necessário. As demais (`body_fat`, `muscle_mass`) continuam obrigatórias.

### Endpoints

| Método | Rota | Regra |
|---|---|---|
| `POST` | `/api/bioimpedance` | criação manual; 409 se `measured_at` já existe |
| `GET` | `/api/bioimpedance?from&to` | série ordenada asc |
| `PUT` | `/api/bioimpedance/{id}` | grava auditoria com snapshot antes/depois |
| `DELETE` | `/api/bioimpedance/{id}` | grava auditoria `DELETE` |
| `POST` | `/api/bioimpedance/import` | lote JSON; resposta por item: `CREATED`/`DUPLICATE`/`ERROR` |
| `GET` | `/api/bioimpedance/{id}/history` | lê `bioimpedance_log`, mais recente primeiro |

**Contrato de import (item)**

```json
{
  "measuredAt": "2026-11-08T07:30:00Z",
  "bodyWeightKg": 82.4,
  "heightCm": 178.0,
  "bodyFatPercentage": 18.2,
  "muscleMassKg": 38.1,
  "skeletalMuscleMassKg": 36.0,
  "visceralFat": 8,
  "waterPercentage": 55.3,
  "source": "PDF_INBODY",
  "sourceFileHash": "sha256-hex"
}
```

**Regras e validação**
- Faixas: gordura 0–70, água 0–100, visceral 0–60, peso 20–400 kg, altura 100–250 cm, `measuredAt` ≤ agora + 1 dia.
- Dedupe por `(user, measuredAt)` e por `(user, fileHash)`; duplicata não é erro do lote.
- Import é **transacional por item**, não pelo lote: um item ruim não derruba os outros.
- Auditoria: verificar se `Bioimpedance` já usa `@Audited` (existem `revinfo`/`revchanges` no V1). Se não usar, gravar `bioimpedance_log` explicitamente no service com `ObjectMapper` → `old_data`/`new_data` JSONB. Não usar as duas abordagens ao mesmo tempo.
- Se optar por upload in-app depois: `POST /api/bioimpedance/imports` multipart → calcula SHA-256 → `POST /extract` no sidecar → devolve **preview** (não persiste) → usuário confirma → `POST /api/bioimpedance/import`.

### Critérios de aceite

- [ ] Importar o mesmo arquivo duas vezes → segunda resposta `DUPLICATE`, sem linha nova.
- [ ] Lote com 1 item inválido: 2 criados, 1 `ERROR`, lote não aborta.
- [ ] Editar uma medição gera linha em `bioimpedance_log` com `old_data` e `new_data`.
- [ ] Medição de A invisível para B.
- [ ] Faixa inválida → 400 com `ProblemDetail`/`ErrorResponse` padrão.

**Escopo:** M/L (8–12 arquivos). O sidecar Python, se existir, fica fora deste repo/backend.

---

## Task 5 — Analytics e progressão

**Objetivo:** transformar log em decisão: “o que eu levanto hoje?” e “estou evoluindo?”.

### Endpoints

| Método | Rota | Retorno |
|---|---|---|
| `GET` | `/api/exercises/{id}/stats?from&to` | melhor carga, melhor e1RM, volume total, nº de sessões, última execução, buckets mensais |
| `GET` | `/api/playlists/{id}/next-targets` | por exercício: última execução + alvo sugerido |
| `GET` | `/api/dashboard?weeks=12` | treinos/semana, volume semanal, streak, PRs recentes, Δ peso, próxima rotina |
| `GET` | `/api/bioimpedance/trend?metric&from&to&window=7` | pontos + média móvel + delta absoluto/percentual |

### Algoritmo de progressão (double progression)

```
para cada exercício da rotina:
  últimas = logs do usuário+exercício nas últimas 3 sessões encerradas
  se vazio: sugestão = {repsMin, repsMax, peso = null}   // primeira vez
  se todas as séries da última sessão atingiram targetRepsMax:
      peso = últimaCarga + increment   (increment = exercise.incrementKg ?? 2.5; 0 para peso corporal)
      reps = targetRepsMin
  senão:
      peso = últimaCarga
      reps = min(últimaReps + 1, targetRepsMax)
```

Regras:
- `increment_kg` por exercício (halteres 2 kg, barra 2,5 kg, máquina 5 kg). Default 2,5.
- Exercício de peso corporal (`increment = 0`): só sobe reps; ao bater o teto, sugere variação mais difícil (fora do MVP — apenas sinalizar).
- Sessões `ABANDONED` não entram no cálculo.
- Sem `targetRepsMax`: não sugerir progressão; devolver `null`.

### Queries e armadilhas

- Buckets semanais: `date_trunc('week', started_at AT TIME ZONE 'America/Sao_Paulo')`. Com `timestamptz` (D7) isso é correto; com `timestamp` quebra.
- Stats por exercício: uma query agregada + uma query de buckets. **Nunca** carregar logs em memória.
- `GET /sessions/{id}` e `/{playlist}/next-targets` usam `JOIN FETCH`/projeção; sem isso vira N+1.
- Streak: semanas ISO consecutivas com `count(FINISHED) >= metaSemanal`; meta default 4, configurável depois.
- Estagnação (pode ficar fora do MVP): e1RM sem subir há 4 semanas com ≥4 sessões no período.
- Sem cache: escala pessoal. Só adicionar quando uma query passar de ~200 ms.

### Critérios de aceite

- [ ] Fixtures com timestamps fixos: 3 séries em 10 reps com teto 10 → sugere +2,5 kg e volta a 8 reps.
- [ ] 3 séries em 8 reps (abaixo do teto) → sugere +1 rep, mesma carga.
- [ ] Dashboard soma volume semanal corretamente em semanas com 0 treino (buckets contínuos, não só semanas existentes).
- [ ] Trend devolve média móvel de 7 pontos e delta vs início do período.
- [ ] Nenhuma query do dashboard faz mais de 6 idas ao banco (verificar com `spring.jpa.show-sql`).

**Escopo:** L (10–14 arquivos: 3 services, 3 controllers, projeções, queries nativas, testes).

---

## Trilha paralela — cliente mobile (fora das 5, mas bloqueia o uso real)

As 5 tasks acima são backend. O app Expo hoje tem 3 telas vazias; sem cliente, o loop não é usável. Fatia mínima, em paralelo a T2/T3:

1. Login + persistência de cookie (`expo-secure-store` não guarda cookie HttpOnly — usar `expo-web-browser`/cookie jar do `fetch` ou repensar token no mobile).
2. Tela “Treino ativo”: exercício atual, input peso/reps, +série, volume, encerrar.
3. Lista de rotinas + histórico de sessões.
4. Dashboard simples (treinos na semana, volume, peso).
5. Import de bioimpedância só depois de T4 (provavelmente via share/upload de arquivo).

> **Risco de plataforma:** cookie `HttpOnly` + `SameSite=Lax` funciona no web e no fetch nativo do RN, mas não no `expo-web-browser`. Validar cedo; se falhar, o mobile precisa de Bearer token no header (mudança no `JwtAuthenticationFilter`), não de outro app.

---

## Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| `TRUNCATE` do V3 apagar dados locais | alto | confirmar que não há dado real; backup antes |
| `started_at`/`measured_at` sem timezone | médio | migrar para `timestamptz` em V4/V6 e testar com fuso SP |
| PR como booleano único | médio | documentar que é e1RM; coluna `pr_type` se precisar distinguir depois |
| Editar rotina muda o passado | médio | sessão guarda `playlist_id`, mas não o prescrito; versionar rotina é task futura (`playlist_version`) |
| PDF/LLM extrai valor errado | alto | preview + confirmação humana; nunca persistir direto do parser |
| Duplicata offline | médio | UUID do cliente + unique constraints |
| Duas sessões abertas / lost update | médio | índice parcial único + `@Version` |
| `secondary_muscle NOT NULL` | baixo | tornar nullable em V5 |
| Testes de data quebram em outro fuso | baixo | fixar `Clock`/timestamps UTC nos testes |

## Questões abertas (bloqueiam apenas a task correspondente)

1. **T4:** parser de PDF roda como sidecar Python ou importador offline gera JSON? (recomendo offline agora)
2. **T3:** catálogo de exercícios é global com custom por usuário (recomendado) ou 100% por usuário?
3. **T2:** PR é e1RM (recomendado) ou carga máxima?
4. **T2:** sessão pode ser livre (recomendado) ou sempre exige rotina?

## Checkpoints

- **Após T1:** isolamento entre 2 usuários provado por teste; suíte verde.
- **Após T2:** fluxo abrir→logar→encerrar com volume e PR corretos; idempotência provada.
- **Após T3:** rotina reordenada e clonada; catálogo semeado.
- **Após T4:** import idempotente + auditoria.
- **Após T5:** dashboard com números conferidos manualmente contra fixtures.

## Status

- **T1 concluída (2026-11-09):** `V3__ownership.sql`, `userId` em `Playlist`/`WorkoutSession`/`Bioimpedance`/`Exercise`, `CurrentUser`, catálogo global + custom, isolamento provado por `ExerciseOwnershipIT`. Suíte 34/34 verde.
  - Desvio do plano: as três tabelas raiz usam `UUID userId` (não `@ManyToOne`); finders escopados entram junto com T2/T3/T4.
  - Corrigido bug pré-existente: `LoggingAspect` embrulhava toda exceção em `RuntimeException`, impedindo 403/404 do `GlobalExceptionHandler`.
- **T2 concluída (2026-11-09):** `V4__session_core.sql`, `SessionStatus`, `WorkoutSession` (status/ended_at/version/playlist opcional), `WorkoutLog` (`client_log_id`, `rpe`, `notes`), endpoints `/api/sessions` (start, active, logs, delete log, finish, list, detail), volume recalculado, PR por e1RM, idempotência por `clientLogId`. Suíte 39/39 verde.
  - Desvios: `clientLogId` separado do id do servidor (o `BaseEntity` gera UUID; forçar id do cliente quebraria o padrão); replay idempotente devolve 200 via `LogResult`; migração de `started_at` para `timestamptz` adiada (Hibernate valida contra o tipo atual; fica para T5 junto com `date_trunc`).
- **T3 concluída (2026-11-09):** `V5__routines.sql` + `R__seed_exercises.sql` (16 exercícios globais), busca paginada/arquivamento de exercício, CRUD de playlists, clone, archive, add/update/remove exercise, reorder transacional. Suíte 80/80 verde.
  - `GET /api/exercises` mudou de `List` para `PageDto` (sem cliente externo ainda); `POST /{id}/exercises` devolve 201 + Location.
  - Desvios: seed inicial tem 16 exercícios (não 60–100); `increment_kg` de exercício global não é editável (cópia custom resolve); faixa de reps invertida devolve 409.
- **T4 concluída (2026-11-09):** `V6__bioimpedance_import.sql` (novas métricas, soft delete, unique por `measured_at`/hash), CRUD + import em lote (`CREATED`/`DUPLICATE`/`ERROR` por item) + histórico de auditoria em `bioimpedance_log`. Suíte 92/92 verde.
  - Decisão D8 aplicada: **sem parser de PDF no backend**. O contrato é `POST /api/bioimpedance/import` com JSON normalizado; o script Python de `doc-process/` gera esse JSON.
  - Desvios: `PUT` virou `PATCH /{id}` (atualização parcial); DELETE é soft delete (`deleted_at`) para preservar a FK da auditoria e liberar o slot único; import é uma transação — duplicata concorrente pode falhar o lote (`shortcut:`).
- **T4.5 concluída (2026-11-09):** upload de PDF com tabela de jobs, sem RabbitMQ. `V7__bioimpedance_import_jobs.sql`; `POST /api/bioimpedance/imports` (202 + Location), `GET /api/bioimpedance/imports/{jobId}`; processamento `@Async` chamando o sidecar Python (`POST /extract`, timeout 60 s); preview pronto para confirmar no `/import` existente. Suíte 107/107 verde.
  - Dedupe por hash do arquivo (job PENDING/PROCESSING/DONE é reaproveitado; FAILED permite retry).
  - Desvios: arquivo não é persistido (só nome + hash + resultado em JSONB).
  - **Reaper e auth do parser (2026-11-09):** `BioimpedanceImportJobReaper` roda no startup e a cada 5 min, marcando `PROCESSING` mais antigo que `bioimpedance.import.stale-after` (3 min) como `FAILED`; `markDone`/`markFailed` não sobrescrevem estado terminal. O parser envia `X-Parser-Token` quando `bioimpedance.parser.token` está configurado.
  - **Pacotes 3/4/6 (2026-11-09):** multipart limitado a 10 MB (413 tratado), executor dedicado `bioimpedanceExecutor` (2 threads, fila 10, AbortPolicy) e rejeição vira job `FAILED`; `POST /api/bioimpedance/imports/{jobId}/confirm` persiste o preview usando o hash do job (segundo confirm → 409). Suíte 116/116 verde.
- **T5 concluída (2026-11-09):** `V8__analytics.sql` migra `started_at`/`ended_at`/`measured_at` para `timestamptz` (D7, adiado até aqui); `GET /api/exercises/{id}/stats` (agregados + buckets mensais), `GET /api/playlists/{id}/next-targets` (double progression), `GET /api/dashboard?weeks=12` (semanas contínuas, streak, PRs recentes, Δ peso, próxima rotina) e `GET /api/bioimpedance/trend?metric&window` (pontos + média móvel + delta). Analytics sempre escopado por `CurrentUser`; ABANDONED não entra em nenhum cálculo. Suíte 135/135 verde.
  - e1RM segue a decisão D6 também aqui (`reps = 1` → peso): a fórmula corrigida foi aplicada em `maxE1rmExcludingSession` (PR) e nos agregados de stats, mantendo a mesma definição em todo o sistema.
  - Progressão: todas as séries da última sessão FINISHED no teto → +`incrementKg` (default 2,5; 0 em peso corporal sobe reps), senão +1 rep; sem histórico sugere só `repsMin`; sem `targetRepsMax` não sugere.
  - Dashboard: streak conta semanas consecutivas com ≥4 treinos; a semana corrente incompleta não quebra a sequência. Mínimo de queries: 4 (sessões, PRs, bioimpedância, playlist fallback).
  - Trend aceita `bodyWeightKg`, `bodyFatPercentage`, `muscleMassKg`, `skeletalMuscleMassKg`, `visceralFat`, `waterPercentage`; valores nulos são ignorados. `window` limita a 1..30 pontos.
  - Desvios: dashboard usa a janela de `weeks` também para o streak (não busca histórico além dela); testes unitários usam `Clock.fixed` via `ClockConfig`.

