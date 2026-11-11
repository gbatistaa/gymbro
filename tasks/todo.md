# TODO — telas do PWA Gymbro

Plano completo, critérios de aceite e arquivos por task: `tasks/plan.md`.
Specs: `docs/screens.md` e `docs/brand-identity.md`.

Comandos: backend `./mvnw test` · focado `./mvnw -Dtest=<Teste> test` ·
web `cd web && pnpm lint && pnpm typecheck && pnpm build`.
Testes Java com `@DisplayName` em inglês (projeto fora de `coding/ses`).

Decisões já fechadas: Histórico na aba Progresso · endpoint de exercícios com filtro/ordenação/
paginação · volume por músculo na v1 · troca de senha + username + login por e-mail ou username.

---

## Fase 1 — Backend habilitando as telas

- [ ] Task 1: Migration `V12__users_username.sql` com backfill, `NOT NULL` e único por `lower(username)`
- [ ] Task 2: `username` em `User`, `CreateUserDto`, `UserDto`, `UserSummaryProjection`, mapper e service
- [ ] Task 3: `LoginDto.identifier` e login por e-mail ou username
- [ ] Task 4: `PUT /api/users/me/password` (400 `INVALID_CURRENT_PASSWORD`, nunca 401)
- [ ] Task 5: `sort` com whitelist em `/api/exercises` + `GET /api/exercises/muscles`
- [ ] Task 6: `PlaylistSummaryDto` com `exerciseCount` e `lastPerformedAt`
- [ ] Task 7: `GET /api/dashboard/muscle-volume`
- [ ] Task 8: Fuso do usuário nos buckets mensais (`monthlyExerciseBuckets`)
- [ ] Task 9: Regenerar `docs/api/openapi.json`

**Checkpoint Fase 1**
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

**Checkpoint Fase 2**
- [ ] `cd web && pnpm lint && pnpm typecheck && pnpm build`
- [ ] Rota privada sem sessão → `/signin?next=`
- [ ] Sem flash de conteúdo privado durante a validação

## Fase 3 — Início

- [ ] Task 16: Início com sessão ativa, próximo treino, números da semana, volume e PRs

**Checkpoint Fase 3**
- [ ] Conta nova mostra vazio com CTA; conta com histórico mostra os cinco blocos

## Fase 4 — Treinar

- [ ] Task 17: Lista de rotinas com resumo, duplicar, arquivar e iniciar
- [ ] Task 18: Editor de rotina com reordenação, alvos e sugestão de progressão

**Checkpoint Fase 4**
- [ ] Reordenar persiste após recarregar
- [ ] `409 SESSION_ALREADY_ACTIVE` oferece continuar a sessão ativa

## Fase 5 — Sessão ao vivo

- [ ] Task 19: Sessão ao vivo com numeral único, stepper por `incrementKg`, PR, descanso e encerramento

**Checkpoint Fase 5**
- [ ] Retry com rede desligada não duplica série
- [ ] Volume finalizado aparece no Início

## Fase 6 — Progresso

- [ ] Task 20: Histórico de sessões com filtro de período e paginação
- [ ] Task 21: Detalhe de sessão concluída
- [ ] Task 22: Visão geral com volume semanal e volume por músculo
- [ ] Task 23: Estatísticas de exercício + biblioteca de exercícios
- [ ] Task 24: Corpo / bioimpedância (tendência, delta, lista)
- [ ] Task 25: Nova medição manual + importação de PDF com revisão

**Checkpoint Fase 6**
- [ ] Três telas de Progresso navegam entre si sem perder período
- [ ] Import de PDF chega à revisão e confirma

## Fase 7 — Perfil

- [ ] Task 26: Dados, troca de senha, logout e exclusão de conta

## Fase 8 — PWA e fechamento

- [ ] Task 27: Manifest, ícone `G`, service worker mínimo
- [ ] Task 28: Acessibilidade, contraste, 320px e `prefers-reduced-motion`

**Checkpoint Final**
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
