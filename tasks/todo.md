# TODO — telas do PWA Gymbro

Plano completo, critérios de aceite e arquivos por task: `tasks/plan.md`.
Specs: `docs/screens.md` e `docs/brand-identity.md`.

Comandos: backend `./mvnw test` · focado `./mvnw -Dtest=<Teste> test` ·
web `cd web && pnpm lint && pnpm typecheck && pnpm build`.
Testes Java com `@DisplayName` em inglês (projeto fora de `coding/ses`).

Decisões já fechadas: Histórico na aba Progresso · endpoint de exercícios com filtro/ordenação/
paginação · volume por músculo na v1 · troca de senha + username + login por e-mail ou username.

**Skills por task: ver a seção [Skills por task](#skills-por-task) no fim deste arquivo.** Invoque
antes de começar a task, não depois.

---

## Fase 1 — Backend habilitando as telas

- [x] Task 1: Migration `V12__users_username.sql` com backfill, `NOT NULL` e único por `lower(username)`
- [x] Task 2: `username` em `User`, `CreateUserDto`, `UserDto`, `UserSummaryProjection`, mapper e service
- [x] Task 3: `LoginDto.identifier` e login por e-mail ou username
- [x] Task 4: `PUT /api/users/me/password` (400 `INVALID_CURRENT_PASSWORD`, nunca 401)
- [x] Task 5: `sort` com whitelist em `/api/exercises` + `GET /api/exercises/muscles`
- [ ] Task 6: `PlaylistSummaryDto` com `exerciseCount` e `lastPerformedAt`
- [ ] Task 7: `GET /api/dashboard/muscle-volume`
- [ ] Task 8: Fuso do usuário nos buckets mensais (`monthlyExerciseBuckets`)
- [ ] Task 9: Regenerar `docs/api/openapi.json`

### Checkpoint Fase 1

- [ ] `cd backend && ./mvnw test` verde
- [ ] Snapshot OpenAPI revisado: só adições esperadas
- [ ] Login por e-mail e por username devolvem 200 com cookies

## Fase 2 — Fundação do frontend

- [ ] Task 10: Contratos Zod (`auth` atualizado + `page`, `exercise`, `playlist`, `session`, `analytics`, `bioimpedance`)
- [ ] Task 11: `requestMaybe` em `lib/http.ts` + `useResource`
- [ ] Task 12: `lib/format.ts` (kg, %, data no fuso, duração, relativo)
- [ ] Task 13: Primitivos em `components/ui/` (SectionLabel, DataRow, Button, Field, EmptyState, ErrorState, Skeleton, Notice, ConfirmDialog)
- [ ] Task 14: Casca `(app)`, barra inferior, guard de sessão; remover `app/page.tsx`
- [ ] Task 15: Signin por identificador e signup com username

## Checkpoint Fase 2

- [ ] `cd web && pnpm lint && pnpm typecheck && pnpm build`
- [ ] Rota privada sem sessão → `/signin?next=`
- [ ] Sem flash de conteúdo privado durante a validação

## Fase 3 — Início

- [ ] Task 16: Início com sessão ativa, próximo treino, números da semana, volume e PRs

### Checkpoint Fase 3

- [ ] Conta nova mostra vazio com CTA; conta com histórico mostra os cinco blocos

## Fase 4 — Treinar

- [ ] Task 17: Lista de rotinas com resumo, duplicar, arquivar e iniciar
- [ ] Task 18: Editor de rotina com reordenação, alvos e sugestão de progressão

### Checkpoint Fase 4

- [ ] Reordenar persiste após recarregar
- [ ] `409 SESSION_ALREADY_ACTIVE` oferece continuar a sessão ativa

## Fase 5 — Sessão ao vivo

- [ ] Task 19: Sessão ao vivo com numeral único, stepper por `incrementKg`, PR, descanso e encerramento

### Checkpoint Fase 5

- [ ] Retry com rede desligada não duplica série
- [ ] Volume finalizado aparece no Início

## Fase 6 — Progresso

- [ ] Task 20: Histórico de sessões com filtro de período e paginação
- [ ] Task 21: Detalhe de sessão concluída
- [ ] Task 22: Visão geral com volume semanal e volume por músculo
- [ ] Task 23: Estatísticas de exercício + biblioteca de exercícios
- [ ] Task 24: Corpo / bioimpedância (tendência, delta, lista)
- [ ] Task 25: Nova medição manual + importação de PDF com revisão

### Checkpoint Fase 6

- [ ] Três telas de Progresso navegam entre si sem perder período
- [ ] Import de PDF chega à revisão e confirma

## Fase 7 — Perfil

- [ ] Task 26: Dados, troca de senha, logout e exclusão de conta

## Fase 8 — PWA e fechamento

- [ ] Task 27: Manifest, ícone `G`, service worker mínimo
- [ ] Task 28: Acessibilidade, contraste, 320px e `prefers-reduced-motion`

### Checkpoint Final

- [ ] `cd web && pnpm lint && pnpm typecheck && pnpm build`
- [ ] `cd backend && ./mvnw test`
- [ ] Checklist §11 do `brand-identity.md` aplicado a cada tela

---

## Fora de escopo desta versão

- Edição de username no Perfil
- Volume por dia ou por sessão em gráficos separados
- Exportação de dados
- Tema claro
- Rotação de refresh token e revogação de access token

---

## Skills por task

Invoque com a `skill` tool (`skill({ id: "..." })`) **antes** de abrir o editor. A primeira da lista é
a principal; as outras são apoio. Mais de três skills numa task é sinal de que a task precisa ser
quebrada, não de que precisa de mais skill.

### Fase 1 — Backend

| Task | Skills                                                                                  | Por quê                                                                                                                                    |
| ---- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `deprecation-and-migration`, `test-driven-development`                              | Coluna nova com backfill é expand/contract: anulável → preencher → `NOT NULL` + índice único. Teste do backfill antes da migration. |
| 2    | `api-and-interface-design`, `test-driven-development`                               | Campo obrigatório novo em contrato público (`CreateUserDto`, `UserDto`) e propagação até o mapper.                                 |
| 3    | `security-and-hardening`, `api-and-interface-design`, `test-driven-development`   | Superfície de autenticação: enumerar usuário, resposta idêntica para e-mail/username inexistente, rate limit por identificador.        |
| 4    | `security-and-hardening`, `test-driven-development`                                 | Troca de senha mexe em hash, revogação de sessão e no código de erro que não pode ser 401.                                             |
| 5    | `api-and-interface-design`, `security-and-hardening`, `test-driven-development`   | `sort` é entrada do cliente chegando no SQL: whitelist obrigatória.                                                                     |
| 6    | `api-and-interface-design`, `performance-optimization`, `test-driven-development` | DTO de resumo pretende eliminar N+1; a performance é o motivo da task existir.                                                             |
| 7    | `api-and-interface-design`, `performance-optimization`, `test-driven-development` | Agregação nova sobre `workout_log`; custo da query é parte do aceite.                                                                  |
| 8    | `debugging-and-error-recovery`, `test-driven-development`                           | Bug conhecido com causa raiz já identificada (fuso fixo no SQL nativo): reproduzir em teste, corrigir uma vez.                             |
| 9    | `documentation-and-adrs`, `api-and-interface-design`                                | Snapshot OpenAPI é contrato publicado; o diff precisa ser lido, não aceito.                                                               |

### Skills — Fase 2 — Fundação do frontend

| Task | Skills                                                                                | Por quê                                                                                                     |
| ---- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 10   | `api-and-interface-design`, `source-driven-development`                           | Zod 4 tem API própria (`z.iso.datetime`, `z.uuid`); conferir na doc evita pattern de Zod 3.             |
| 11   | `vercel-react-best-practices`, `api-and-interface-design`                         | Hook de fetch, deduplicação de 401 e descarte de resposta obsoleta são exatamente o que as regras cobrem. |
| 12   | `frontend-ui-engineering`, `source-driven-development`                            | Formatação é parte da identidade (vírgula decimal, mono, tabular); `Intl` tem detalhe por locale.      |
| 13   | `frontend-ui-engineering`, `design-craft`, `web-design-guidelines`              | Primitivos definem a linguagem visual e a acessibilidade de todas as telas seguintes.                        |
| 14   | `frontend-ui-engineering`, `security-and-hardening`, `mobile-first-design`      | Guard de sessão, sem flash de conteúdo privado, safe area e navegação por teclado.                       |
| 15   | `frontend-ui-engineering`, `security-and-hardening`, `api-and-interface-design` | Formulários de auth: identificador novo, erros por campo, nenhum token persistido.                          |

### Fases 3 a 7 — Telas

| Task | Skills                                                                                                      | Por quê                                                                                                    |
| ---- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 16   | `frontend-ui-engineering`, `design-craft`, `vercel-react-best-practices`                              | Cinco blocos com hierarquia forte e um único CTA; dados vêm de três chamadas.                            |
| 17   | `frontend-ui-engineering`, `vercel-react-best-practices`                                                | Lista com ações destrutivas e tratamento de `409` sem perder o contexto.                                |
| 18   | `frontend-ui-engineering`, `vercel-react-best-practices`, `incremental-implementation`                | Reordenação com persistência e otimismo é a parte mais fácil de quebrar; entregar item por item.       |
| 19   | `frontend-ui-engineering`, `design-craft`, `performance-optimization`, `incremental-implementation` | Tela-assinatura em aparelho fraco, uma mão, com retry idempotente. O numeral único é decisão de design. |
| 20   | `frontend-ui-engineering`, `vercel-react-best-practices`, `performance-optimization`                  | Paginação e agrupamento por semana sem refetch desnecessário.                                            |
| 21   | `frontend-ui-engineering`, `web-design-guidelines`                                                      | Tela de leitura: hierarquia, semântica de tabela/régua e a11y.                                            |
| 22   | `frontend-ui-engineering`, `design-craft`, `performance-optimization`                                 | Barras horizontais e densidade alta sem biblioteca de charts.                                               |
| 23   | `frontend-ui-engineering`, `vercel-react-best-practices`, `api-and-interface-design`                  | Stats mensais, link para detalhe e formulário de exercício no mesmo fluxo.                                |
| 24   | `frontend-ui-engineering`, `design-craft`, `performance-optimization`, `incremental-implementation` | Série temporal em SVG, média móvel e estados de dado insuficiente.                                       |
| 25   | `frontend-ui-engineering`, `debugging-and-error-recovery`, `incremental-implementation`               | Job assíncrono com polling, falha e revisão obrigatória: fluxo com muitos estados.                       |
| 26   | `frontend-ui-engineering`, `security-and-hardening`, `api-and-interface-design`                       | Senha, logout e exclusão de conta; erro de senha atual não pode deslogar.                                 |

### Fase 8 — Fechamento

| Task | Skills                                                                               | Por quê                                                                                                     |
| ---- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| 27   | `source-driven-development`, `performance-optimization`, `shipping-and-launch` | Manifest e service worker mudaram no Next 16; cache errado em produção é regressão difícil de reverter. |
| 28   | `web-design-guidelines`, `frontend-ui-engineering`, `mobile-first-design`      | Revisão final de a11y, contraste, 320px e `prefers-reduced-motion`.                                       |

### Transversais (não são tasks, valem para todas)

| Skill                             | Quando                                                                                                                      |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `ponytail`                      | Já ativo na sessão. Mantém a task no menor diff que resolve.                                                             |
| `incremental-implementation`    | Uma task por sessão; checkpoints entre fases.                                                                              |
| `code-review-and-quality`       | Antes de cada commit de task concluída.                                                                                    |
| `ponytail-review`               | Alternativa mais enxuta ao anterior para diffs pequenos.                                                                    |
| `git-workflow-and-versioning`   | Ao criar branch/commit por fase. Nada de commit sem autorização explícita.                                               |
| `context-engineering`           | Início de sessão nova ou ao trocar de fase.                                                                               |
| `browser-testing-with-devtools` | Verificação visual e de console nas telas. Exige o MCP `chrome-devtools` configurado; sem ele, validar por build + SSR. |
| `using-agent-skills`            | Só em dúvida sobre qual skill se aplica.                                                                                  |

### Skills disponíveis que **não** entram neste plano

| Skill                                                                                                                                                                              | Motivo                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shadcn`                                                                                                                                                                         | Pressupõe Tailwind + `components.json`; o projeto usa CSS Modules e o `AGENTS.md` exige decisão explícita para adotar shadcn. Revisitar só se essa decisão for tomada. |
| `design-mobile-apps`                                                                                                                                                             | Ferramenta Sleek para projeto visual; aqui a identidade já está em `docs/brand-identity.md`.                                                                                |
| `spec-driven-development`, `planning-and-task-breakdown`, `interview-me`, `idea-refine`                                                                                    | Já consumidas: o spec (`docs/screens.md`) e o plano (`tasks/plan.md`) existem e as decisões estão fechadas.                                                              |
| `constraint-driven-development`                                                                                                                                                  | Opcional: só se quiser um `CONSTRAINTS.md` com barra de qualidade medida (cobertura, performance). Não é requisito das telas.                                              |
| `observability-and-instrumentation`                                                                                                                                              | Não há telemetria/alertas no escopo do MVP.                                                                                                                                   |
| `ci-cd-and-automation`                                                                                                                                                           | Não há pipeline de CI neste repositório ainda.                                                                                                                               |
| `pull-request`, `merge-request`, `review-pr`                                                                                                                                 | Só no momento de abrir/revisar PR; não são passos de implementação.                                                                                                        |
| `ponto-funcao`, `report`, `find-skills`, `opencode`, `rea-*`, `reverse-engineer-anything`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain`, `ponytail-help` | Fora do domínio desta entrega.                                                                                                                                                 |
