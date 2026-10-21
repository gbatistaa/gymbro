# Gymbro — Funcionalidades possíveis (backend + interface)

Baseado apenas no schema atual (`V1__init.sql`). Cada bloco indica **o que o backend expõe**, **o que a interface faz** e **quais tabelas usa**.

## 1. Mapa do schema atual

| Tabela | Papel | Campos-chave |
|---|---|---|
| `exercises` | catálogo de exercícios | `name`, `primary_muscle`, `secondary_muscle` |
| `playlists` | template/rotina de treino | `name` |
| `playlist_exercise` | composição ordenada da rotina | `order_index`, `target_sets`, FK playlist/exercise |
| `workout_session` | execução de uma rotina | `started_at`, `ended_at`, `total_volume`, FK playlist |
| `workout_log` | série executada | `set_number`, `weight`, `reps`, `is_pr`, FK session/exercise |
| `bioimpedance` | medição de composição corporal | `body_fat_percentage`, `muscle_mass_kg`, `visceral_fat`, `water_percentage`, `measured_at` |
| `bioimpedance_log` | auditoria das medições | `action_type`, `old_data`/`new_data` (JSONB) |

**Lacuna estrutural:** não existe tabela de usuário. Hoje tudo é global. Qualquer feature "por pessoa" (histórico, PR, streak, metas) exige `user_id` em `playlists`, `workout_session` e `bioimpedance` (e um `users`). O `JwtProperties` já existe, então a autenticação é o primeiro passo natural.

---

## 2. Domínio: Exercícios

### 2.1 Catálogo pesquisável e semeado
- **Backend:** `GET /api/v1/exercises?q=&muscle=&page=`, paginação, busca case/acento-insensível (trigram no Postgres), seed Flyway com ~100 exercícios.
- **Interface:** autocomplete no momento de montar a rotina, filtro por músculo, agrupamento por grupo muscular, criação inline de exercício novo.
- **Tabelas:** `exercises`.

### 2.2 Deduplicação e normalização
- **Backend:** detecção de duplicata por nome normalizado (`Supino reto` vs `supino reto `) e alias/variação do mesmo movimento.
- **Interface:** ao digitar, avisa "já existe, usar este?" em vez de criar lixo no catálogo.
- **Tabelas:** `exercises`.

### 2.3 Estatísticas por exercício
- **Backend:** `GET /api/v1/exercises/{id}/stats` → melhor carga, melhor 1RM estimado (Epley), volume total histórico, frequência, última execução, evolução mês a mês.
- **Interface:** página do exercício com gráfico de carga/reps ao longo do tempo e "seu recorde é X kg em DD/MM".
- **Tabelas:** `workout_log`, `workout_session`, `exercises`.

### 2.4 Músculo como taxonomia, não texto livre
- **Backend:** enum/validação de grupo muscular + endpoint de distribuição de volume por músculo (`primary` e `secondary` com peso menor).
- **Interface:** gráfico de equilíbrio muscular (peito vs costas, push/pull/legs), alerta de desequilíbrio.
- **Tabelas:** `exercises`, `workout_log`, `workout_session`.
- **Requer:** padronizar `primary_muscle`/`secondary_muscle`.

---

## 3. Domínio: Rotinas (playlists)

### 3.1 CRUD completo com ordenação
- **Backend:** criar/editar/clonar/arquivar rotina; reordenar itens por `order_index` em uma única chamada (recebe a lista de ids na nova ordem); `target_sets` por exercício.
- **Interface:** drag & drop da ordem dos exercícios, duplicar rotina ("Push A → Push A (cópia)"), arquivar sem apagar histórico.
- **Tabelas:** `playlists`, `playlist_exercise`.

### 3.2 Geração automática de rotina
- **Backend:** `POST /api/v1/playlists/generate` com `{foco, diasPorSemana, duracaoMin}` → monta a divisão (full body, upper/lower, PPL) escolhendo exercícios do catálogo e distribuindo `target_sets`.
- **Interface:** wizard de 3 passos; preview editável antes de salvar.
- **Tabelas:** `exercises`, `playlists`, `playlist_exercise`.

### 3.3 Sugestão de progressão (o "cérebro" do app)
- **Backend:** para cada item da rotina, olhar as últimas N execuções e sugerir a próxima sessão por *double progression*: bateu o topo da faixa de reps em todas as séries → +2,5 kg e volta ao piso de reps; senão → +1 rep.
  - `GET /api/v1/playlists/{id}/next-targets`
- **Interface:** cada exercício mostra "última vez: 3×10 @ 40 kg · hoje: 3×8 @ 42,5 kg" e botões de aceitar/ajustar.
- **Tabelas:** `playlist_exercise`, `workout_log`.
- **Requer:** faixa de reps alvo (`target_reps_min/max`) em `playlist_exercise` — hoje só existe `target_sets`.

### 3.4 Compartilhamento de rotina
- **Backend:** link público read-only com slug/token, ou export/import JSON de uma rotina.
- **Interface:** "compartilhar rotina" gera link/QR; importar rotina de alguém.
- **Tabelas:** `playlists`, `playlist_exercise`.

### 3.5 Versionamento de rotina
- **Backend:** snapshot imutável da composição no momento em que a sessão começa (garante que o histórico não mude se a rotina for editada depois).
- **Interface:** sessão antiga mostra exatamente o que foi prescrito naquele dia.
- **Tabelas:** `playlist_exercise` + nova `playlist_version` (ou copiar `target_sets` para a sessão).

---

## 4. Domínio: Sessão de treino (o coração)

### 4.1 Sessão em andamento (live workout)
- **Backend:** `POST /api/v1/sessions` abre sessão; `POST /api/v1/sessions/{id}/logs` adiciona série; `PATCH` encerra e calcula `total_volume = Σ(weight × reps)`. Retomar sessão aberta ao reabrir o app.
- **Interface:** tela de treino com exercício atual, campo peso/reps grande, botão "+ série", check por exercício, cronômetro e volume acumulado em tempo real.
- **Tabelas:** `workout_session`, `workout_log`.
- **Requer:** `ended_at` nullable / status (`IN_PROGRESS`, `FINISHED`, `ABANDONED`).

### 4.2 Rest timer e execução guiada
- **Backend:** guardar `rest_seconds` por exercício e devolver o plano de descanso; opcionalmente `target_reps`.
- **Interface:** timer automático ao registrar série, notificação/vibração, "pular descanso".
- **Tabelas:** `playlist_exercise` (+ coluna `rest_seconds`).

### 4.3 Detecção automática de PR
- **Backend:** ao inserir um log, comparar com o histórico do mesmo exercício: PR de carga, PR de reps naquela carga, PR de 1RM estimado e PR de volume na sessão. Preenche `is_pr` sozinho (hoje é o cliente quem manda).
- **Interface:** badge/confete "Novo recorde!", lista de PRs por exercício, "quebrado por último em...".
- **Tabelas:** `workout_log`, `workout_session`.

### 4.4 Estimativa de 1RM e volume efetivo
- **Backend:** cálculo de 1RM estimado (Epley/Brzycki) e volume por músculo a partir dos logs.
- **Interface:** "seu supino estimado é 92 kg", série de 1RM estimado ao longo do tempo.
- **Tabelas:** `workout_log`, `exercises`.

### 4.5 Desfazer/editar série
- **Backend:** `DELETE /logs/{id}` e edição com recálculo do `total_volume` da sessão.
- **Interface:** swipe para apagar a última série, editar peso/reps sem refazer a sessão.
- **Tabelas:** `workout_log`, `workout_session`.

### 4.6 Modo offline-first (crucial para academia)
- **Backend:** aceitar `Idempotency-Key` / UUID gerado no cliente, para reenviar sem duplicar; endpoint de sincronização em lote (`POST /api/v1/sync`).
- **Interface:** registra séries sem sinal, fila local, sincroniza ao reconectar, indicador "pendente de envio".
- **Tabelas:** `workout_session`, `workout_log` (ids UUID já ajudam).

### 4.7 Histórico e repetição de treino
- **Backend:** `GET /api/v1/sessions?from=&to=&playlistId=` paginado; `GET /sessions/{id}` com logs agrupados por exercício; "repetir esta sessão".
- **Interface:** calendário/lista de treinos, detalhe da sessão, botão "treinar de novo" que pré-preenche os pesos da última vez.
- **Tabelas:** `workout_session`, `workout_log`, `playlists`.

---

## 5. Domínio: Progresso e motivação

### 5.1 Dashboard
- **Backend:** `GET /api/v1/dashboard` agregando: treinos na semana, volume semanal, streak, PRs recentes, variação de peso corporal, próximo treino sugerido.
- **Interface:** home com cards e um gráfico principal (volume ou aderência).
- **Tabelas:** `workout_session`, `workout_log`, `bioimpedance`.

### 5.2 Streak e consistência
- **Backend:** sequência de dias/semanas com treino, meta semanal (ex.: 4 treinos), heatmap estilo GitHub dos últimos 12 meses.
- **Interface:** calendário de calor, "3 semanas seguidas", aviso "faltam 2 treinos para bater a meta".
- **Tabelas:** `workout_session`.

### 5.3 Detecção de estagnação
- **Backend:** se um exercício não tem PR nem aumento de carga há X semanas, sinaliza; sugere deload, troca de variação ou ajuste de volume.
- **Interface:** card "Supino estagnado há 5 semanas — tentar deload?".
- **Tabelas:** `workout_log`.

### 5.4 Relatório semanal/mensal
- **Backend:** resumo gerado (volume por músculo, frequência, PRs, aderência, evolução de composição corporal), disponível como JSON e PDF.
- **Interface:** tela de relatório + compartilhar como imagem.
- **Tabelas:** todas as de treino + `bioimpedance`.

### 5.5 Gamificação leve
- **Backend:** conquistas calculadas a partir do histórico (primeiro PR, 100 treinos, 10 t de volume acumulado, mês perfeito).
- **Interface:** badges no perfil.
- **Tabelas:** `workout_session`, `workout_log`.

---

## 6. Domínio: Composição corporal (bioimpedância)

### 6.1 Série temporal e tendência
- **Backend:** `GET /api/v1/bioimpedance?from=&to=` + endpoint de tendência (média móvel, variação absoluta/percentual por métrica).
- **Interface:** gráficos de gordura, massa muscular, visceral e água; comparar com 30/90/365 dias.
- **Tabelas:** `bioimpedance`.

### 6.2 Correlação treino × corpo
- **Backend:** cruzar volume/massa muscular/gordura por período — ex.: "em semanas com volume > X, massa magra subiu".
- **Interface:** gráfico sobreposto treino vs composição corporal e insights textuais simples.
- **Tabelas:** `bioimpedance`, `workout_session`, `workout_log`.

### 6.3 Importação de balança
- **Backend:** upload de CSV/JSON ou webhook de balança inteligente, com deduplicação por `measured_at`.
- **Interface:** importar planilha, revisar antes de salvar.
- **Tabelas:** `bioimpedance`.

### 6.4 Auditoria e histórico de medições
- **Backend:** `GET /api/v1/bioimpedance/{id}/history` lendo `bioimpedance_log` (INSERT/UPDATE/DELETE com `old_data`/`new_data`); opcional "restaurar versão".
- **Interface:** timeline "medição editada em DD/MM", diff antes/depois.
- **Tabelas:** `bioimpedance_log` (já modelado, hoje sem uso).

### 6.5 Metas corporais
- **Backend:** meta de gordura/massa com data-alvo; projeção linear pela tendência atual ("nesse ritmo, meta em ~11 semanas").
- **Interface:** barra de progresso da meta e projeção.
- **Tabelas:** `bioimpedance` (+ tabela `goals`).

---

## 7. Transversais (backend)

| Feature | Por quê |
|---|---|
| **Autenticação JWT + `user_id`** | Pré-requisito de quase tudo acima; já há `JwtProperties`. |
| **API versionada `/api/v1`** | Evita quebra de clientes. |
| **Erros padronizados (RFC 7807)** | `ProblemDetail` do Spring; a UI trata erro de forma uniforme. |
| **Paginação e filtros em toda listagem** | Histórico cresce rápido. |
| **OpenAPI/Swagger** | Contrato único para o frontend e para testes. |
| **Validação de regras** | `reps > 0`, `order_index` único por playlist, `ended_at > started_at`, `target_sets > 0`. |
| **Soft delete / arquivamento** | Não perder histórico ao remover rotina/exercício. |
| **Idempotência e sync em lote** | Essencial para uso offline na academia. |
| **Cache curto** | Catálogo de exercícios e dashboard (leitura frequente). |
| **Exportação completa (LGPD)** | `GET /api/v1/me/export` devolve tudo em JSON. |
| **Rate limiting** | Protege login e endpoints de escrita. |
| **Observabilidade** | Logs estruturados, métricas de latência e de uso por endpoint. |
| **Testcontainers** | Já configurado — usar para integration tests reais em Postgres. |

---

## 8. Sugestão de prioridade

**MVP (maior valor / menor esforço)**
1. Auth + `user_id`.
2. CRUD de exercícios e rotinas (com ordenação).
3. Sessão em andamento + logs + `total_volume` calculado no servidor.
4. Histórico de sessões com detalhe.
5. Dashboard simples (treinos na semana, volume, PRs).
6. Bioimpedância: CRUD + gráfico de tendência.

**Segunda onda**
7. Detecção automática de PR e 1RM estimado.
8. Sugestão de progressão (double progression).
9. Streak/heatmap e relatório semanal.
10. Offline-first com idempotência.
11. Auditoria via `bioimpedance_log`.

**Depois**
12. Geração automática de rotina, compartilhamento, gamificação, correlação treino × corpo, metas e projeções.

---

## 9. Mudanças de schema que algumas features exigem

- `users` + `user_id` em `playlists`, `workout_session`, `bioimpedance`.
- `workout_session.status` e `ended_at` nullable (sessão em andamento).
- `playlist_exercise`: `target_reps_min`, `target_reps_max`, `rest_seconds`.
- `workout_log`: `rpe` e `notes` (opcionais) para progressão mais inteligente.
- `exercises`: enum de músculo, `equipment`, `video_url`, `is_archived`.
- `bioimpedance`: `body_weight_kg` e `height_cm` (permitem IMC e comparabilidade).
- `playlist_version` (ou cópia do prescrito para a sessão) para histórico fiel.
