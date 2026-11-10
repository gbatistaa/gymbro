# TODO — App mobile do Gymbro

Plano completo, critérios de aceite e riscos: `mobile/tasks/plan.md`.
Identidade visual (fonte de verdade de cor, tipo, espaço): `docs/brand-identity.md`.
Contrato da API: `docs/api/openapi.json` → tipos em `mobile/src/lib/api/schema.d.ts` (`npm run api:types`).

**Decisões fechadas:** Bearer (não cookie) · online-only (sem fila local) · tema escuro apenas.

**Rotina por tela** (não pule etapa): briefar → estruturar → implementar com primitivos → mover →
auditar → gate do brand §11 + `tsc` + `lint`.
**Conflito de skills:** `design-craft` > `design-mobile-apps` > `emil-design-eng` > `web-design-guidelines`.

Comandos: `npx tsc --noEmit` · `npx expo lint` · `npm test` (jest / jest-expo) · `npm run api:types` (regenera tipos do backend).

---

## Fase 0 — Fundação visual

- [x] Task 1: `app.json` escuro e marca (splash e ícone `#121110`, nome `Gymbro`)
- [x] Task 2: Tokens espelhados (`theme.ts` + `tailwind.config.js` + `global.css`)
- [x] Task 3: Fontes IBM Plex carregadas no root
- [x] Task 4: Primitivos de layout (`Screen`, `Rule`, `Label`, `SectionHeader`)
- [x] Task 5: Primitivos de dado (`Text`, `DataRow`, `Numeral`, `Button`)
- [x] Task 6: Casca de quatro abas com Feather
- [x] Task 7: Remover o template do Expo

**Checkpoint Fase 0**
- [x] App abre escuro, sem flash claro, Plex em Sans e Mono (bundle Android exporta; verificação visual pendente)
- [x] Quatro abas com ícone Feather e indicador de 2px na ativa
- [x] `npx tsc --noEmit` e `npx expo lint` verdes

## Fase 1 — Sessão e cliente de API

- [x] Task 8: `api/client.ts` com Bearer e erro tipado
- [x] Task 9: Mapa `code → mensagem PT-BR`
- [x] Runner de teste configurado (`jest-expo`, 42 testes) — não estava no plano; entrou aqui porque `client.ts` e o mapa de códigos são lógica pura
- [x] Task 10: Armazenamento de tokens (`secure-store` + memória)
- [x] Task 11: Refresh automático em 401
- [x] Task 12: Tela de login
- [x] Task 13: Tela de registro

**Checkpoint Fase 1**
- [ ] Login real contra o backend local (exige backend rodando; não executado)
- [x] Token expirado → refresh transparente → requisição refeita (provado por teste: cliente + renovador)
- [x] Refresh inválido → volta ao login limpando storage (`onRefused` → `clearSession` + guarda em `(tabs)`)
- [x] Restauração de sessão no boot a partir do refresh token

## Fase 2 — Catálogo e rotinas

- [x] Task 14: Lista de exercícios com busca e paginação
- [x] Task 15: Criar e editar exercício em sheet
- [x] Task 16: Lista de rotinas
- [ ] Task 17: Detalhe da rotina
- [ ] Task 18: Editar itens da rotina (adicionar, remover, reordenar)

**Checkpoint Fase 2**
- [ ] Criar rotina com três exercícios e reordená-los
- [ ] Toda lista usa régua; nenhum card com sombra como padrão

## Fase 3 — Treino ao vivo (elemento-assinatura)

- [ ] Task 19: Iniciar e retomar sessão
- [ ] Task 20: Tela de treino com numeral XL
- [ ] Task 21: Entrada de série com teclado decimal
- [ ] Task 22: Concluir ou abandonar sessão
- [ ] Task 23: Badge de PR e volume total
- [ ] Task 24: Estados de rede e erro no treino

**Checkpoint Fase 3**
- [ ] 4 séries de 2 exercícios, concluídas, em device real
- [ ] Um único `numeralXL` na tela
- [ ] Sinal cair: erro claro, sem perder a série digitada

## Fase 4 — Progresso e histórico

- [ ] Task 25: Dashboard de progresso
- [ ] Task 26: Histórico de sessões
- [ ] Task 27: Detalhe de sessão
- [ ] Task 28: Estatística por exercício e próximo alvo

**Checkpoint Fase 4**
- [ ] Dashboard bate com `curl /api/dashboard` do mesmo usuário
- [ ] Streak, volume e PRs conferem com o servidor

## Fase 5 — Perfil e dados pessoais

- [ ] Task 29: Perfil com nome, e-mail e fuso
- [ ] Task 30: Bioimpedância — lista e tendência
- [ ] Task 31: Exclusão de conta

**Checkpoint Fase 5**
- [ ] Trocar fuso muda a semana do dashboard
- [ ] Excluir conta apaga tudo e volta ao login

## Fase 6 — Maturidade

- [ ] Task 32: Acessibilidade
- [ ] Task 33: Auditoria de movimento e `reduced motion`
- [ ] Task 34: Alvo web
- [ ] Task 35: Performance de listas e abertura
- [ ] Task 36: Revisão tela a tela

**Checkpoint Final**
- [ ] Checklist do `brand-identity.md` §11 em todas as telas
- [ ] Nenhum emoji, nenhuma segunda cor de acento, nenhum gradiente
- [ ] `npx tsc --noEmit` e `npx expo lint` verdes

---

## Perguntas abertas (bloqueiam tasks específicas)

- `SLEEK_API_KEY` existe? Sem ela, a estrutura de tela é feita pelo `design-craft` (afeta a rotina de todas as telas).
- Bioimpedância entra no MVP? (Task 30; pode ser cortada sem afetar o laço principal)
- Login social na Fase 1? (a loja pode exigir Sign in with Apple)
- Existe onboarding, ou o app abre direto no login?
