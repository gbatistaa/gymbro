# Gymbro — Mapa de telas e mapeamento do backend

Documento de produto e de interface. Descreve o que o backend já oferece, quais telas o PWA deve
ter, o que cada tela consome, estados obrigatórios, lacunas do backend e a ordem de implementação.

**Data:** 2026-11-11
**Escopo:** PWA `web/` (Next.js 16, App Router) contra a API `backend/` (Spring Boot 4).
**Referências:** `docs/brand-identity.md`, `AGENTS.md`, `docs/context/2026-11-11-handoff.md`.

---

## 0. Estado atual

- `/signin` e `/signup` implementados e integrados à API com cookies `HttpOnly`.
- `/` ainda é o placeholder do scaffold ("Hello world!").
- Não existe casca autenticada, guard de rotas privadas, barra de navegação, manifest nem service
  worker.
- Safe area superior aplicada: `--safe-area-top: env(safe-area-inset-top, 0px)` em
  `web/src/app/globals.css`, `padding-top` no `body` e `min-height: calc(100svh - var(--safe-area-top))`
  no `AuthShell`. O layout raiz já declara `viewportFit: "cover"`.
  - Efeito colateral conhecido: qualquer elemento futuro com `position: fixed` no topo da tela deve
    usar `top: var(--safe-area-top)` em vez de `top: 0`, ou ficará sob a câmera frontal.

---

## 1. O que o backend realmente oferece hoje

| Módulo | Endpoints | Dados que a UI pode mostrar |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `auth` | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout` | sessão por cookie `HttpOnly`; nenhum token no corpo |
| `user` | `GET /api/users/me`, `PUT /api/users/me`, `DELETE /api/users/me` | nome, e-mail, timezone, `createdAt`, `updatedAt` |
| `exercise` | `POST /api/exercises`, `GET /api/exercises?q&muscle&includeArchived&page&size`, `GET /api/exercises/{id}/stats`, `PUT /api/exercises/{id}`, `DELETE /api/exercises/{id}` (arquiva) | nome, músculo primário, músculo secundário, equipamento, `incrementKg`, `isArchived` |
| `exercise stats` | `GET /api/exercises/{id}/stats?from&to` | nº de sessões, volume total, melhor carga, melhor e1RM, última execução, buckets mensais (volume + melhor e1RM) |
| `playlist` | `GET /api/playlists?includeArchived`, `POST /api/playlists`, `GET /api/playlists/{id}`, `PUT /api/playlists/{id}`, `POST /api/playlists/{id}/clone`, `POST /api/playlists/{id}/archive`, `POST /api/playlists/{id}/exercises`, `PATCH /api/playlists/{id}/exercises/{itemId}`, `DELETE /api/playlists/{id}/exercises/{itemId}`, `PUT /api/playlists/{id}/order`, `GET /api/playlists/{id}/next-targets` | nome, descrição, `archivedAt`, itens com `targetSets`, `targetRepsMin`, `targetRepsMax`, `restSeconds`, nota e `orderIndex` |
| `next-targets` | `GET /api/playlists/{id}/next-targets` | última carga/reps por exercício e **carga/reps sugerida** (regra de progressão) |
| `workout_session` | `POST /api/sessions`, `GET /api/sessions/active` (204 quando não há), `POST /api/sessions/{id}/logs`, `DELETE /api/sessions/{id}/logs/{logId}`, `PATCH /api/sessions/{id}` (finish/abandon), `GET /api/sessions?from&to&page&size`, `GET /api/sessions/{id}` | `status`, `startedAt`, `endedAt`, `totalVolume`, `notes`, séries agrupadas por exercício, flag `isPr` por série, `version` |
| `dashboard` | `GET /api/dashboard?weeks=12` | séries semanais (sessões + volume), streak de semanas, PRs recentes, delta de peso, próxima rotina sugerida (`nextPlaylistId`/`nextPlaylistName`), timezone do usuário |
| `bioimpedance` | `POST /api/bioimpedance`, `GET /api/bioimpedance?from&to`, `PATCH /api/bioimpedance/{id}`, `DELETE /api/bioimpedance/{id}`, `GET /api/bioimpedance/trend?metric=&from=&to=&window=`, `POST /api/bioimpedance/import` (lote JSON), `GET /api/bioimpedance/{id}/history` | peso, altura, % gordura, massa muscular, massa esquelética, gordura visceral, % água, fonte, hash do arquivo; histórico de alterações por medição |
| `bioimpedance/imports` | `POST /api/bioimpedance/imports` (multipart PDF), `GET /api/bioimpedance/imports/{jobId}`, `POST /api/bioimpedance/imports/{jobId}/confirm` | job assíncrono: `status` (`PENDING`/`PROCESSING`/`DONE`/`FAILED`), resultado JSON extraído, erro, `createdAt`, `finishedAt` |

### 1.1 Regras de negócio que a interface precisa respeitar

- **Uma sessão `IN_PROGRESS` por usuário.** A segunda tentativa de iniciar recebe
  `409 SESSION_ALREADY_ACTIVE`.
- **Séries só são editáveis enquanto a sessão está em andamento.** `addLog` e `deleteLog` devolvem
  conflito após o encerramento.
- **`clientLogId` garante idempotência.** Reenviar a mesma série com o mesmo `clientLogId` devolve
  `200` em vez de criar duplicata; payload diferente com o mesmo id devolve
  `409 CLIENT_LOG_CONFLICT`.
- **`setNumber` é derivado no backend** quando não enviado (último + 1) e é único por exercício dentro
  da sessão.
- **PR é calculado no backend** por e1RM (`peso × (1 + reps/30)`), comparado apenas com sessões
  anteriores do mesmo usuário/exercício.
- **Progressão sugerida** usa o `incrementKg` do exercício (padrão `2.5 kg`) quando todas as séries
  atingem `targetRepsMax`; caso contrário incrementa repetições.
- **Tudo é escopado por usuário.** Nenhuma tela pode assumir acesso a recurso de outro usuário.
- **O fuso do usuário manda** no dashboard, no streak e no agrupamento semanal.
- **Encerrar com `FINISHED` ou `ABANDONED`** é a única transição de status exposta; `PATCH` é
  idempotente quando o status já é o desejado.

---

## 2. Navegação

Quatro abas, conforme `docs/brand-identity.md`: **Início · Treinar · Progresso · Perfil**.

- Mobile: barra inferior fixa, respeitando `--safe-area-top` no topo e a safe area inferior na barra.
- Ícone + rótulo visível em cada aba; estado ativo indicado por cor **e** forma/peso.
- Alvo de toque mínimo de 48×48px.
- Em telas largas a navegação pode virar barra lateral, mantendo destinos, rótulos e hierarquia.
- Cada destino é deep link e sobrevive a recarregamento; o guard continua sendo aplicado.

Sub-rotas previstas:

```text
/                        Início
/train                   Rotinas
/train/playlists/[id]    Editor de rotina
/train/sessions/[id]     Sessão ao vivo ou sessão concluída (pelo status)
/train/history           Histórico de sessões
/train/exercises         Biblioteca de exercícios
/progress                Progresso
/progress/exercises/[id] Estatísticas de um exercício
/progress/body           Corpo / bioimpedância
/progress/body/new       Nova medição e importação
/profile                 Perfil e configurações
```

---

## 3. Telas

### A. Início — `/` (substitui o placeholder)

**Objetivo:** responder "o que eu faço agora" em três segundos.

Blocos, na ordem de prioridade:

1. **Sessão em andamento** — se `GET /api/sessions/active` devolver `200`: nome da rotina, tempo
   decorrido, volume parcial, botão *Continuar*. É o único bloco com destaque verde da tela.
2. **Próximo treino** — `DashboardDto.nextPlaylistName` mais o alvo do primeiro exercício
   (`next-targets`): "Supino · 60 kg × 8". CTA *Iniciar*.
3. **Faixa de números da semana** — sessões, volume, streak (`currentStreakWeeks`) e delta de peso
   (`weightDeltaKg`) em linha de dado com régua, não em cards idênticos.
4. **Volume por semana** — mini-barras das últimas 12 semanas (`weeks[]`), sem eixo decorativo.
5. **PRs recentes** — lista em mono: exercício, carga × reps, e1RM, "há 6 d".

**Consome:** `GET /api/dashboard`, `GET /api/sessions/active`, `GET /api/playlists/{id}/next-targets`.

**Estados:** sem rotina criada; sem sessão ativa; primeira semana sem dados (vazio com ação "Criar
rotina"); erro de carregamento com retry.

---

### B. Treinar — `/train`

**Objetivo:** hub de rotinas.

- Lista de rotinas (`GET /api/playlists?includeArchived=`) com nome e, por item, contagem de
  exercícios e última execução (requer detalhe ou chamada adicional por rotina).
- Ações por item: iniciar sessão, duplicar (`POST /clone`), arquivar (`POST /archive`).
- Toggle "mostrar arquivadas".
- CTA primário: *Nova rotina* (`POST /api/playlists`).

**Estados:** lista vazia (primeiro uso), rotina arquivada, erro de rede.

---

### C. Rotina — `/train/playlists/[id]`

**Objetivo:** editar a rotina. É editor, não dashboard.

- Cabeçalho: nome, descrição, contagem de exercícios, duração estimada.
- Lista ordenável de exercícios com `3 × 8–12`, descanso `90 s` e nota da margem.
- Reordenação por arrastar ou setas para cima/baixo → `PUT /order`.
- Cada linha mostra **última carga e sugestão** vindas de `next-targets`. Esse é o diferencial do
  produto e precisa estar visível também no editor.
- Ações: adicionar exercício (busca em `GET /api/exercises?q=`), editar alvos
  (`PATCH .../exercises/{itemId}`), remover item, duplicar rotina, arquivar rotina.

**Estados:** rotina vazia; exercício referenciado que foi arquivado; conflito ao reordenar; erro de
validação (`targetSets` 1–20, `restSeconds` 0–600, nome ≤ 120).

---

### D. Sessão ao vivo — `/train/sessions/[id]`

**Objetivo:** registrar série sem atrito. Tela-assinatura do produto; uma tela, uma ação.

- Um único `numeralXL` por tela: a carga atual. Ao lado, as reps; unidade alinhada pela linha de base.
- Stepper de carga respeitando o `incrementKg` do exercício, com botões `±` e entrada numérica.
- Reps com `±1` e entrada numérica.
- `clientLogId` gerado no cliente **antes** do `POST` → retry de rede não duplica série.
- Lista das séries já feitas do exercício ativo em linhas separadas por régua; série concluída em
  verde; badge `PR` com texto (não apenas cor).
- Navegação entre exercícios da rotina, com o alvo ao lado (`60 kg × 8`, vindo de `next-targets`).
- Timer de descanso opcional, discreto, usando `restSeconds`. Sem modal bloqueante.
- Rodapé fixo: *Finalizar* (`PATCH` com `FINISHED`) e *Abandonar* (`PATCH` com `ABANDONED`, com
  confirmação, porque descarta a sessão).

**Consome:** `GET /api/sessions/{id}` (detalhe), `POST /api/sessions/{id}/logs`,
`DELETE /api/sessions/{id}/logs/{logId}`, `PATCH /api/sessions/{id}`,
`GET /api/playlists/{id}/next-targets`.

**Estados:** offline ou falha de rede (série fica pendente e reenvia com o mesmo `clientLogId`);
sessão já finalizada em outra aba (`409`); conflito de `setNumber`; sessão vazia ao finalizar.

---

### E. Histórico — `/train/history`

- `GET /api/sessions?from&to&page&size`, agrupado por semana.
- Cada linha: data, rotina, volume, duração, número de séries, marcador de PR.
- Filtro de período: 4 semanas, 12 semanas, personalizado.
- Toque abre o detalhe da sessão.

**Estados:** vazio, fim da paginação, erro.

---

### F. Sessão concluída — `/train/sessions/[id]`

Somente leitura (`GET /api/sessions/{id}`): volume total, duração, séries por exercício, PRs
destacados, notas. Ação secundária: *Repetir esta rotina*.

---

### G. Biblioteca de exercícios — `/train/exercises`

- Busca (`q`), filtro por músculo (`muscle`), toggle de arquivados.
- Linha: nome, músculo primário, equipamento, `incrementKg`.
- Formulário de criar/editar: nome (3–225), músculo primário (obrigatório), secundário, equipamento,
  incremento em kg.
- Arquivar é destrutivo do ponto de vista do catálogo → confirmação explícita.

**Estados:** vazio, nenhum resultado para a busca, erro de validação.

---

### H. Progresso — `/progress`

Tela de leitura, densidade alta, sem animação.

- Métricas do período no topo: volume total, sessões, streak, delta de peso.
- Volume semanal (barras).
- PRs recentes.
- Atalhos para Exercício e Corpo.

**Consome:** `GET /api/dashboard` e, para o restante, chamadas por exercício.

---

### I. Exercício — `/progress/exercises/[id]`

- `GET /api/exercises/{id}/stats`: número de sessões, volume total, melhor carga, **melhor e1RM** (a
  métrica real de progressão), última execução.
- Gráfico mensal de volume e de e1RM (`monthlyBuckets`).
- As últimas séries exigem chamadas adicionais às sessões — ver lacunas.

**Estados:** exercício nunca executado, exercício arquivado.

---

### J. Corpo / Bioimpedância — `/progress/body`

- Tendência por métrica (`GET /api/bioimpedance/trend?metric=&window=`): `bodyWeightKg`,
  `bodyFatPercentage`, `muscleMassKg`, `skeletalMuscleMassKg`, `visceralFat`, `waterPercentage`.
- Seletor de métrica; no topo, delta absoluto e percentual do período.
- Linha do valor mais média móvel (`window` de 1 a 30).
- Lista de medições com data, fonte (`manual`/`IMPORT`) e link para o histórico de alterações
  (`GET /api/bioimpedance/{id}/history`).

**Estados:** nenhuma medição, métrica sem valores no período, série única (sem tendência).

---

### K. Nova medição e importação — `/progress/body/new`

Dois caminhos no mesmo fluxo:

1. **Entrada manual** — `POST /api/bioimpedance`. Campos com validação espelhada do backend: `%` de
   gordura 0–70, massa muscular > 0, visceral 0–60, água 0–100, peso 20–400 kg, altura 100–250 cm,
   massa esquelética > 0, `measuredAt` não pode ser futuro.
2. **Importar PDF** — `POST /api/bioimpedance/imports` (multipart) → polling de
   `GET /api/bioimpedance/imports/{jobId}` → tela de revisão com os campos extraídos → confirmação
   (`POST .../confirm`).

A revisão é obrigatória: o parser é heurístico e o usuário precisa corrigir antes de gravar.

**Estados:** job `PENDING`/`PROCESSING` (progresso neutro, sem spinner circular decorativo),
`FAILED` com mensagem do backend, arquivo duplicado (o backend devolve o job existente com `200`).

---

### L. Perfil — `/profile`

- Nome, e-mail e timezone (`PUT /api/users/me`), com validação de fuso IANA.
- Unidade fixa kg e idioma PT-BR como informação.
- Sobre / versão do PWA.
- *Sair* (`POST /api/auth/logout`).
- *Excluir conta* (`DELETE /api/users/me`), com confirmação por digitação.

---

## 4. Lacunas do backend expostas por essas telas

1. **Nenhum endpoint lista os músculos disponíveis.** O filtro de exercícios precisa de uma lista
   fixa no front ou de um `GET /api/exercises/muscles`. Decisão pendente.
2. **Troca de senha não existe.** `UpdateUserDto` não tem campo de senha; o Perfil fica sem essa ação
   ou ela vira tarefa de backend.
3. **Não há exclusão de sessão.** Só abandono via `PATCH`; não existe `DELETE /api/sessions/{id}`.
4. **Não há agregação de volume por músculo** no dashboard. Progresso precisaria de N chamadas ou de
   um endpoint novo.
5. **`monthlyExerciseBuckets` usa `America/Sao_Paulo` fixo** no SQL nativo, enquanto o restante
   respeita `user.timezone`. Divergência de dados para usuário fora do fuso.
6. **`GET /api/sessions/active` responde `204`.** O contrato Zod precisa tratar corpo vazio
   explicitamente, caso contrário o parse explode.
7. **`GET /api/bioimpedance` não é paginado.** A lista de medições carrega tudo que existir.
8. **Sem manifest e service worker.** O app não é instalável; a experiência "aplicativo mobile" fica
   só no layout por enquanto.
9. **`GET /api/playlists` não devolve contagem de exercícios nem última execução.** A lista de
   rotinas exigirá detalhe por rotina ou mudança no DTO.
10. **`GET /api/exercises/{id}/stats` não devolve as últimas séries.** A tela de exercício precisa de
    chamadas extras ou de um campo novo.
11. **Sem endpoint de "resumo do mês"** para o Progresso; hoje só existe agregação semanal no
    dashboard.
12. **Sem rotação de refresh token** e sem revogação do access token no logout — limitação conhecida
    do JWT stateless, não bloqueia UI.

---

## 5. Ordem de implementação sugerida

1. Casca autenticada + guard de rotas privadas + barra inferior. Habilita todo o resto.
2. Início com dados reais do dashboard.
3. Rotinas: lista e editor.
4. Sessão ao vivo — a tela que define o produto.
5. Histórico e detalhe de sessão.
6. Progresso e estatísticas de exercício.
7. Corpo/bioimpedância, começando pela entrada manual e depois pelo import de PDF.
8. Perfil.

---

## 6. Decisões pendentes

1. Histórico e Biblioteca de exercícios ficam dentro de **Treinar**, ou Histórico vai para
   **Progresso**? Histórico vai para progresso
2. O filtro de músculos usa lista fixa no front ou novo endpoint? o ideal é que o mesmo endpoint no backend aceite filtro ordenação e paginação se não existe implemente
3. Volume por músculo entra no Progresso já na v1 (com N chamadas) ou espera endpoint de agregação? já entra na v1
4. Troca de senha entra no Perfil junto com o restante, exigindo endpoint novo, ou fica para depois? entra junto inclusive uma migration para adicionar mais um campo o de nome de usuário, e o usuário no mesmo campo ao fazer login, vai poder se logar usando o email cadastrado ou o username
