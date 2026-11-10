# ADR 0002 — Exclusão de conta: cascata no banco

**Status:** aceito
**Data:** 2026-11-10

## Contexto

`DELETE /api/users/me` precisa apagar a conta. O plano deixou aberta a escolha entre duas
alternativas, porque ela muda o schema e o que se perde:

- **Cascata total** — some a conta e todo o histórico de treino.
- **Anonimização** — some o dado pessoal (nome, e-mail, senha, tokens), mas as sessões, séries e
  medições continuam existindo, desligadas de qualquer identidade.

Nove tabelas pendem do usuário direta ou indiretamente: `refresh_tokens`, `playlists`,
`playlist_exercise`, `workout_session`, `workout_log`, `exercises` (as customizadas),
`bioimpedance`, `bioimpedance_log`, `bioimpedance_import_job`.

## Decisão

**Cascata total, no banco**, via `ON DELETE CASCADE` em todas as FKs que levam ao usuário
(`V11__account_deletion_cascade.sql`). O endpoint executa um único `repository.delete(user)`.

## Por quê

1. **O histórico é dado pessoal.** O registro de carga, série e composição corporal descreve o
   corpo e o comportamento de uma pessoa identificável. Anonimizar mantém esse dado vivo em um
   sistema onde ninguém pode acessá-lo — retenção sem finalidade, que é exatamente o que a LGPD
   chama de excesso. Guardar "por precaução" é passivo, não ativo.
2. **Não existe consumidor dos agregados.** Se um dia houver métrica de produto, ela deve nascer
   agregada e sem vínculo de identidade desde o início, não como sobra de conta apagada.
3. **Cascata no banco não esquece.** Uma sequência de `DELETE` na camada de serviço quebra no dia
   em que alguém adiciona uma tabela nova e não a inclui. A FK é declarativa: quem cria a tabela é
   forçado a decidir o comportamento de exclusão.
4. **Irreversível é o comportamento correto** para "apagar minha conta". Um botão que apaga pela
   metade é pior que um botão que não existe.

## Alternativas consideradas

### Anonimização (`name = 'deleted'`, `email = uuid@deleted`, histórico intacto)
- Prós: preservaria séries históricas para comparação entre usuários; delete mais barato.
- Rejeitado: mantém dado pessoal indefinidamente sem finalidade declarada, e cria a obrigação de
  garantir que nenhuma rota futura consiga religar o histórico a uma pessoa.

### Soft delete (`users.deleted_at`)
- Prós: reversível; não mexe em FKs.
- Rejeitado: "delete" que não apaga é o que a loja de aplicativos e a LGPD consideram descumprido,
  a menos que haja purga posterior — e a purga nunca é implementada.

### Deletes explícitos na camada de serviço
- Prós: sem mudança de schema; o código mostra a ordem.
- Rejeitado: nove instruções em ordem correta, mantidas à mão, para sempre.

## Consequências

- **Apagar uma playlist hard-deleta as sessões que a referenciam** (`workout_session.playlist_id` é
  `NOT NULL`, não há como `SET NULL`). Isso é seguro hoje porque playlist só é removida via
  `archived_at` (soft delete) — a cascata só é exercida na exclusão da conta. Se algum dia houver
  hard delete de playlist, esta decisão precisa ser revisitada.
- **O JWT do usuário apagado continua parseável até expirar** (stateless, sem denylist). As rotas
  que carregam o usuário respondem 401 (`Session is no longer valid`); as que não carregam podem
  devolver 404 ou lista vazia. É o mesmo limite já registrado em `AuthService.logout`.
- Não há janela de arrependimento. Se isso for necessário, entra como soft delete com purga
  agendada — uma decisão nova, não uma emenda silenciosa desta.
- Backup e réplica carregam os dados até expirarem conforme a política de retenção; "apagar de
  verdade" inclui essa política, que vive fora deste repositório.
