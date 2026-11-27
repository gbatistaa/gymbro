# Plano: painel de Progresso (Treino | Bioimpedância)

Plano separado de `tasks/plan.md`, que segue com tasks abertas de outro trabalho.

## Objetivo

A aba Progresso vira um painel com um seletor entre **Treino** e **Bioimpedância**.

- **Treino:** KPIs do período, gráficos dos até 4 exercícios fixados (modal de fixação), lista de
  exercícios treinados com busca, filtro por músculo, ordenação e paginação. Tocar num exercício
  abre a evolução dele com presets de período (semana, mês, ano) e período customizado, nas
  métricas carga máxima, 1RM estimado, volume, séries e repetições.
- **Bioimpedância:** um gráfico de linha suavizada por métrica, com filtro de período
  (1 semana, este mês, últimos 3 e 6 meses, último ano).

## Decisões

- **API nova em `/api/progress`** (módulo `progress/`): lista paginada de exercícios treinados,
  série temporal de um exercício e exercícios fixados (`PUT` idempotente substitui a lista).
- **Ordenação por whitelist** (`sort` + `direction` como enums), SQL com `NamedParameterJdbcTemplate`
  porque o `ORDER BY` é dinâmico; nunca concatenar texto vindo do cliente.
- **Buckets no fuso do usuário** com `date_trunc` (semana ISO começa na segunda, igual ao resto do app).
- **Granularidade escolhida pelo cliente** a partir do tamanho do período: até 92 dias por dia,
  até 400 dias por semana, acima disso por mês.
- **Bioimpedância:** `GET /api/bioimpedance/evolution?from&to` devolve todas as métricas de uma vez
  (um pedido por troca de filtro, não seis). As métricas viram o enum `BioimpedanceMetric`, reusado
  pelo `/trend` existente.
- **Gráficos em SVG próprio** (sem biblioteca): curva monotônica (Fritsch–Carlson) para suavizar sem
  inventar picos que não existem nos dados; crosshair + tooltip; um eixo só.
- **Testes:** JUnit + Testcontainers no backend (TDD), Vitest para a matemática dos gráficos e os
  períodos no frontend.

## Tasks

- [x] 1. `BioimpedanceMetric` + `GET /api/bioimpedance/evolution` (unit + IT)
- [x] 2. Migration `V18__user_pinned_exercises.sql` + `GET/PUT /api/progress/pinned-exercises` (IT)
- [x] 3. `GET /api/progress/exercises` com filtros, ordenação e paginação (IT)
- [x] 4. `GET /api/progress/exercises/{id}/series` com buckets no fuso do usuário (IT)
- [x] 5. Regenerar `docs/api/openapi.json`; suíte completa do backend verde
- [x] 6. Vitest: `chart-math` (escala, ticks, curva monotônica) e `date-ranges` (presets no fuso)
- [x] 7. Componentes de gráfico (`LineChart`) e primitivos (`SegmentedControl`, `Pagination`)
- [x] 8. Aba Treino: KPIs, fixados + modal, lista paginada, modal de evolução
- [x] 9. Aba Bioimpedância: filtros + grade de gráficos
- [x] 10. `pnpm test`, `lint`, `typecheck`, `build` verdes

## Riscos

| Risco | Mitigação |
|---|---|
| `ORDER BY` dinâmico vira injeção de SQL | Enum com a coluna SQL fixa; o parâmetro do cliente só escolhe o enum |
| Bucket de semana/mês no fuso errado | `AT TIME ZONE` com o fuso do usuário, coberto por IT com sessão perto da meia-noite |
| Curva suavizada passa de um valor real (ex.: gordura "negativa") | Interpolação monotônica, testada para não ultrapassar os vizinhos |
