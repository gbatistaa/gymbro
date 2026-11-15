# Gymbro — Product & UI/UX Design Brief

> Briefing autossuficiente para usar o Jules (Google) em um redesign do PWA Gymbro.
> Use este documento junto do código existente. Ele explica o produto, o escopo funcional e a
> direção visual; não substitui os contratos da API nem autoriza criar funcionalidades novas.

**Idioma da interface:** português do Brasil

**Plataforma:** PWA web, mobile-first

**Estado do produto neste documento:** conferido em 15/11/2026

---

## 1. Instrução principal para o Jules

Redesenhe a experiência do Gymbro para que seja mais clara, acolhedora e fácil de usar, sobretudo
durante um treino na academia. Preserve as funcionalidades existentes, os dados apresentados, as
regras de negócio, os contratos com a API e a identidade visual descrita aqui.

Antes de alterar o código:

1. Inspecione o projeto e identifique as telas já implementadas e os componentes reutilizáveis.
2. Use as telas planejadas neste documento para orientar a experiência completa, mas não trate telas
   planejadas como funcionalidades já implementadas.
3. Melhore hierarquia, navegação, legibilidade, compreensão dos próximos passos, formulários e estados
   vazios/erro/carregamento. Não invente métricas, conteúdo, fluxos ou respostas de API.
4. Mantenha o stack, os componentes e os padrões existentes. Não troque dependências nem faça mudanças
   no backend sem necessidade explícita.
5. Trabalhe em fatias pequenas e preserve acessibilidade, layout responsivo e uso com uma mão.

**Resultado desejado:** um app que pareça um caderno de treino digital confiável — simples de entender
em poucos segundos, rápido de operar entre séries e útil para decidir o próximo treino. “Mais amigável”
significa mais claro e acolhedor, não mais infantil, genérico ou gamificado.

---

## 2. Produto e público

### O que é

Gymbro é o caderno de treino de quem já treina: registra carga, séries, repetições e volume sem atrito
e ajuda a pessoa a decidir como progredir na próxima sessão.

### Para quem

- Público central: pessoa com aproximadamente 1–3 anos de treino, familiarizada com exercícios,
  séries, repetições, PR e volume.
- Contexto: uso frequente no celular, dentro da academia, com uma mão livre, atenção dividida, luz
  forte e conexão que pode falhar.
- Idioma e unidades: PT-BR, quilogramas e vírgula decimal (ex.: `42,5 kg`).

### Princípios de experiência

1. **Ação principal evidente:** cada tela deve deixar claro o próximo passo, sem competir com ações
   secundárias.
2. **Registro sem atrito:** dados essenciais grandes e legíveis; controles fáceis de tocar; feedback
   imediato ao registrar ou editar.
3. **Dados confiáveis:** números, períodos e sugestões sempre identificados; não apresentar
   estimativas como valores medidos.
4. **Acolhimento sem julgamento:** orientar a pessoa quando não houver dados; evitar tom de cobrança
   ou mensagens motivacionais genéricas.
5. **Progressão compreensível:** quando houver sugestão de carga/repetições, mostrar o que foi feito
   anteriormente e o que está sendo sugerido.

### Não objetivos

- Não redesenhar como rede social, jogo ou produto de coaching por IA.
- Não adicionar chat, gamificação, confete, streaks ou recomendações que não sejam suportados pelo
  produto/API.
- Não alterar regras de treino, cálculos, permissões, autenticação ou contratos da API para resolver
  uma questão visual.
- Não simular dados ou funcionalidades futuras como se já estivessem disponíveis.

---

## 3. Escopo funcional e estado atual

Use os marcadores abaixo para não confundir o que existe com o que está apenas planejado:

- **Frontend implementado:** já há tela ou fluxo no PWA atual.
- **API disponível:** o backend oferece os dados ou a operação, mas a experiência visual pode ainda
  não estar implementada.
- **Planejado/futuro:** ideia ou tela descrita nos documentos do produto; não deve ser apresentada
  como existente.

### 3.1 Frontend implementado

| Área | O que existe hoje |
| --- | --- |
| Entrar — `/signin` | Login com e-mail ou nome de usuário e senha; validação, estados de envio/erro e retorno ao destino solicitado. |
| Criar conta — `/signup` | Cadastro com nome, usuário, e-mail e senha; validação e mensagens de erro nos campos. |
| Casca autenticada | Navegação principal para Início, Treinar, Progresso e Perfil; navegação inferior mobile e link de pular para o conteúdo. |
| Início — `/` | Resumo semanal, volume das últimas 12 semanas, PRs recentes, próximo treino e sessão em andamento quando existir. Permite iniciar ou continuar treino. |
| Treinar — `/train` | Listagem de rotinas, criação, iniciar, duplicar e arquivar rotina; alternância para exibir rotinas arquivadas; link para biblioteca de exercícios. |
| Editor — `/train/playlists/[id]` | Nome/descrição da rotina, inclusão e remoção de exercícios, edição de alvos, ordenação e sugestão de progressão baseada no histórico. |
| Progresso — `/progress` | Apenas estrutura/placeholder no frontend atual. |
| Perfil — `/profile` | Apenas estrutura/placeholder no frontend atual. |

**Importante:** iniciar uma sessão leva à rota prevista `/train/sessions/[id]`, mas a tela de sessão ao
vivo não está implementada no frontend atual. O mesmo cuidado vale para links de biblioteca e outros
destinos previstos: valide no código antes de tratá-los como fluxos completos.

### 3.2 Funcionalidades com suporte no backend

Podem orientar o desenho das telas planejadas, sem afirmar que já estão implementadas na interface:

- **Conta e sessão:** cadastro, login, renovação e logout; perfil com nome, usuário, e-mail, fuso
  horário, troca de senha e exclusão de conta.
- **Exercícios:** criar, buscar, filtrar por grupo muscular, editar e arquivar; equipamento e
  incremento de carga; estatísticas com sessões, volume, melhor carga, e1RM e execução mais recente.
- **Rotinas:** listar, criar, editar, clonar, arquivar; adicionar/remover exercícios; definir séries,
  faixa de repetições e descanso; ordenar; consultar carga/repetições anteriores e sugestão seguinte.
- **Sessões:** iniciar, consultar sessão ativa, registrar/remover séries, finalizar ou abandonar,
  consultar histórico e detalhe. Uma série aceita identificador idempotente para evitar duplicação
  em reenvios.
- **Dashboard:** sessões e volume por semana, sequência semanal, PRs recentes, variação de peso,
  próxima rotina e agregação de volume por músculo.
- **Composição corporal:** registrar/editar/excluir medições, acompanhar tendências por métrica,
  importar dados e importar PDF com etapa de revisão/confirmação; consultar histórico de alterações.

### 3.3 Planejado ou ainda não implementado como experiência

Desenhe apenas se fizer parte do mapa de telas abaixo e mantenha claro que depende de implementação:

- Sessão ao vivo guiada com registro rápido de séries, timer de descanso e finalização.
- Histórico de sessões, detalhes de sessão e repetição de rotina.
- Biblioteca de exercícios como tela completa e detalhes/estatísticas por exercício.
- Progresso com gráficos e filtros; telas de composição corporal e nova medição/importação.
- Perfil editável com configurações de conta.
- Geração automática e compartilhamento de rotinas, gamificação, detecção de estagnação,
  relatórios avançados, metas corporais, correlação treino × corpo e modo offline completo.

---

## 4. Mapa de telas da experiência completa

Rotas são referências da arquitetura atual/planejada; confirme a implementação antes de codificar.

### Acesso e navegação

- `/signin` — entrar com e-mail ou usuário e senha; mostrar erros junto aos campos, envio em
  andamento e link para criar conta.
- `/signup` — criar conta; validação clara de nome, usuário, e-mail e senha; link para entrar.
- Shell autenticado — destinos: **Início**, **Treinar**, **Progresso**, **Perfil**. Em telas pequenas,
  navegação inferior fixa; em telas largas, navegação pode se adaptar sem mudar os destinos.

### Início — `/`

Objetivo: responder “o que faço agora?” em poucos segundos.

Prioridade visual:

1. Se existir sessão ativa: rotina, tempo decorrido, volume parcial e ação **Continuar**.
2. Caso contrário, se houver rotina sugerida: nome, primeira sugestão de exercício/carga e ação
   **Iniciar**.
3. Resumo semanal: sessões, volume, sequência e variação de peso.
4. Volume por semana e PRs recentes, em visualização compacta e fácil de comparar.

Estados: carregando; erro com tentar novamente; conta sem treinos com ação para criar uma rotina;
sem PR; rotina sem exercícios; sem sessão ativa.

### Treinar — `/train`

Hub de rotinas. Exibir nome, quantidade de exercícios, última execução e estado arquivado. Ações:
iniciar, criar, duplicar, arquivar e mostrar/ocultar arquivadas. Preferir lista clara a uma grade de
cards repetidos.

Estados: carregando; erro; nenhuma rotina; nenhuma rotina arquivada; sessão já ativa; confirmação para
arquivar.

### Editor de rotina — `/train/playlists/[id]`

Exibir nome/descrição e lista ordenada. Cada exercício deve tornar fácil entender:

- nome e músculos/equipamento quando disponíveis;
- séries × faixa de repetições e descanso;
- última execução e sugestão de progressão, quando houver dados;
- editar alvos, reordenar, remover ou adicionar exercício.

Usar controles acessíveis por toque e teclado para reordenar; não depender apenas de arrastar.
Confirmar remoção e explicar quando uma rotina arquivada não puder ser editada.

Estados: carregando; erro; rotina sem exercícios; exercício arquivado; sem histórico de treino;
validação/erro ao salvar ou reordenar.

### Sessão ao vivo — `/train/sessions/[id]` (tela planejada)

É a tela mais importante durante o treino. Priorizar uma ação por vez e registro rápido:

- exercício atual e progresso dentro da rotina;
- carga e repetições atuais com controles grandes, numéricos e operáveis com uma mão;
- alvo sugerido e última execução identificados separadamente;
- séries já registradas em linhas comparáveis;
- ação explícita **Registrar série** e opção segura de desfazer/remover uma série;
- descanso não bloqueante, se aplicável;
- ações para avançar exercício, finalizar treino e abandonar com confirmação.

Um único numeral pode dominar a tela: carga ativa. Evitar painéis concorrentes e pop-ups durante a
execução. Indicar claramente se o salvamento estiver pendente. Não prometer operação offline completa
sem implementação.

Estados: carregando; sessão finalizada em outro lugar; erro/rede indisponível; registro pendente;
nenhuma série; fim do treino; confirmação de abandono.

### Histórico — `/train/history` (tela planejada)

Lista agrupada por semana com data, rotina, volume, duração, séries e destaque textual para PR.
Permitir filtros de período (4 semanas, 12 semanas ou intervalo personalizado) e abrir o detalhe.
Estados: vazio, carregando, erro, fim da paginação.

### Sessão concluída — `/train/sessions/[id]` (tela planejada)

Resumo de volume e duração, séries agrupadas por exercício, PRs identificados por texto além de cor,
notas quando disponíveis e ação secundária para repetir a rotina.

### Biblioteca — `/train/exercises` (tela planejada)

Busca por nome, filtro por músculo e opção para incluir arquivados. Lista com nome, músculo,
equipamento e incremento de carga. Criar/editar exercício com labels visíveis. Confirmar arquivamento.
Estados: carregando, erro, sem exercícios e busca sem resultados.

### Progresso — `/progress` (placeholder no frontend atual)

Tela de leitura: métricas do período, volume semanal, PRs recentes e atalhos para estatísticas por
exercício e composição corporal. Evitar excesso de gráficos e eixos decorativos. Destacar tendências
com unidade, período e contexto explícitos.

### Detalhes do exercício — `/progress/exercises/[id]` (tela planejada)

Sessões, volume, melhor carga, melhor e1RM, última execução e evolução mensal. Explicar e1RM como
estimativa. Estados: sem histórico e exercício arquivado.

### Corpo — `/progress/body` (tela planejada)

Selecionar métrica corporal; mostrar valor atual, período e variação absoluta/percentual; gráfico de
tendência e lista de medições com fonte e data. Não misturar unidades ou sugerir causalidade entre
treino e composição corporal sem suporte.

### Nova medição — `/progress/body/new` (tela planejada)

Entrada manual ou importação de PDF. Importação sempre passa por uma etapa de revisão dos valores
extraídos antes de salvar. Mostrar progresso de processamento e erros em linguagem acionável.

### Perfil — `/profile` (placeholder no frontend atual)

Consultar/editar nome, usuário, e-mail e fuso horário; apresentar kg e PT-BR como configurações atuais;
trocar senha, sair e excluir conta. A exclusão planejada exige confirmação inequívoca por digitação.
Não esconder ações destrutivas em ícones sem rótulo.

---

## 5. Direção visual

### Conceito: “caderno técnico com energia”

Combine a organização de um registro de treino — linhas, colunas numéricas e anotações compactas — com
energia visual controlada. O app deve ser preciso, confiável e humano. A identidade é reconhecível
pela composição disciplinada, não por efeitos decorativos.

- **Superfícies:** fundos escuros planos, separados por níveis sutis e linhas finas; sombra apenas em
  menus, diálogos e overlays.
- **Composição:** preferir linhas de dados e listas a pilhas de cards idênticos.
- **Destaque:** uma ação primária por contexto. Na sessão ao vivo, o número ativo pode dominar; nas
  demais telas, usar tipografia, ordem e espaço.
- **Assinatura editorial:** labels mono em caixa alta com uma régua horizontal; números alinhados à
  direita; pequenas anotações na margem.
- **Marca:** wordmark tipográfico `GYMBRO`, sem mascote.
- **Ícones:** uma família SVG consistente (o projeto já usa Lucide); ícones de ação precisam de nome
  acessível e rótulo visível quando a função não for óbvia.

### Paleta oficial — tema escuro

Usar os tokens existentes de `web/src/app/globals.css`; não inventar cores paralelas.

| Token | Hex | Papel |
| --- | --- | --- |
| `canvas` | `#080B0A` | Fundo principal |
| `surface` | `#101715` | Navegação e superfícies discretas |
| `raised` | `#18221D` | Campos, controles e estado pressionado neutro |
| `border` | `#29352E` | Limites de superfícies |
| `rule` | `#35443B` | Separadores de dados |
| `borderStrong` | `#8AA99A` | Foco/contorno funcional |
| `textMuted` | `#A6B5AC` | Texto auxiliar; verificar contraste no uso |
| `textSecondary` | `#C6D2CC` | Texto secundário e unidades |
| `textPrimary` | `#F1F7F3` | Conteúdo principal |
| `accent` | `#4ADE80` | Ação primária e progresso positivo |
| `accentPressed` | `#22C55E` | Ação pressionada |
| `accentTint` | `#10271A` | Realce/seleção verde discreta |
| `info` | `#60A5FA` | Links e informação |
| `infoTint` | `#101F32` | Fundo informativo discreto |
| `danger` | `#F87171` | Erro e ação destrutiva |
| `onAccent` | `#07110A` | Texto/ícone sobre botão verde |

Verde = ação ou progresso; azul = informação ou link; vermelho = erro ou destruição. Não comunicar
estado apenas pela cor. Não reintroduzir âmbar, gradiente roxo, glassmorphism, brilho espalhado ou
gradiente em botão.

### Tipografia e dados

- Interface: IBM Plex Sans. Números e anotações: IBM Plex Mono.
- Manter no máximo essas duas famílias, com fallback equivalente.
- Escala de referência: label 12/16; auxiliar 13/18; corpo 16/24; título de seção 19/26; título de
  tela 23/30; título principal 28/32; métrica 34/38; numeral ativo 56/56 ou, com parcimônia, 88/84.
- Pesos até 600; hierarquia primeiro por peso/contraste e depois por tamanho.
- Usar números tabulares, alinhados à direita; unidades alinhadas à linha de base.
- Formatação PT-BR: `42,5 kg`, milhares com ponto; usar `—` quando o valor não existir.
- Corpo com largura confortável (ideal até 68 caracteres por linha).

### Espaçamento, layout e forma

- Escala base 4: `2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 px`.
- Margem lateral: 20 px no mobile e 32 px em telas maiores; coluna de leitura/formulário até 640 px.
- Alvos de toque: mínimo 48 × 48 px; campos separados o bastante para evitar toques acidentais.
- Raios: 2 px para tags, 6 px para campos/botões, 10 px para painéis pequenos e 16 px para modal.
- Sem sombra em superfícies comuns; use elevação só quando comunicar sobreposição.
- Projetar de 320–430 px para cima, sem rolagem horizontal; aproveitar telas grandes sem esticar
  formulários ou linhas de dados.
- Respeitar safe areas do navegador e não deixar navegação fixa cobrir conteúdo.

### Navegação, controles e feedback

- Mobile: barra inferior fixa com ícone **e rótulo** para Início, Treinar, Progresso e Perfil; estado
  ativo perceptível por forma/peso além de cor.
- Telas largas podem usar barra lateral ou cabeçalho, mantendo destinos e hierarquia.
- Botão primário verde com texto escuro, altura mínima 48 px e raio 6 px; largura total em formulários.
- Secundário em superfície raised; destrutivo em vermelho e com confirmação quando houver perda.
- Labels persistentes em todos os campos; placeholder não substitui label.
- Foco visível com contorno de pelo menos 2 px; estados disabled e loading distinguíveis e acessíveis.
- Loading deve reservar espaço e prevenir envio duplicado; vazio deve explicar o que fazer; erro deve
  ser específico, próximo do campo ou conteúdo afetado e oferecer recuperação quando possível.
- Diálogos não devem bloquear atividades frequentes desnecessariamente. Ações destrutivas exigem
  texto explícito, não só ícone.

### Movimento e acessibilidade

- Transições discretas: cerca de 120 ms para foco/pressão, 160 ms para mudança de estado e até 200 ms
  para entrada de diálogo.
- Animar `transform`/`opacity`, não dimensões; movimento não deve atrasar registro.
- Respeitar `prefers-reduced-motion`.
- Atender WCAG AA: contraste de 4,5:1 para texto normal e 3:1 para texto grande e elementos gráficos
  relevantes. Medir pares reais; não assumir que todo token muted funciona em qualquer fundo.
- Suportar teclado e leitor de tela; estado ativo, erro e carregamento precisam de semântica.
- Não usar emoji como ícone. Texto e estado nunca podem depender só de cor.

---

## 6. Tom de voz e microcopy

- PT-BR direto, respeitoso e específico; usar frases curtas e verbos que descrevam a ação.
- Preferir “Registrar série”, “Continuar treino”, “Criar rotina”, “Tentar novamente”.
- Explicar números e sugestões com contexto: “Última vez: 3 × 10 com 40 kg” e “Sugestão de hoje:
  42,5 kg”, sem apresentar sugestão como obrigação.
- Em estado vazio, explicar por que está vazio e oferecer uma próxima ação útil.
- Erros devem dizer o que aconteceu e como recuperar; não culpar a pessoa.
- Evitar “supere seus limites”, “desbloqueie seu potencial”, urgência artificial, julgamento,
  promessas de resultado e mensagens motivacionais genéricas.

---

## 7. Critérios de aceite para o redesign

- Em poucos segundos, fica claro o que a tela faz e qual é a ação principal.
- A experiência prioriza uso mobile, uma mão, toque e leitura rápida durante o treino.
- A identidade “caderno técnico com energia” continua presente sem depender de decoração.
- Funcionalidades existentes, dados, regras e contratos de API são preservados.
- O que é planejado ou não implementado não aparece como se já funcionasse.
- Todas as telas têm estados de carregamento, vazio e erro apropriados ao seu contexto.
- Nenhuma tela tem overflow horizontal a partir de 320 px; navegação fixa respeita safe areas.
- Contraste, foco, labels, nomes acessíveis, teclado e movimento reduzido são verificados.
- Números usam formato PT-BR, unidade e período claros.
- Não há gamificação, mascotes, emoji, gradientes roxos/âmbar, cards decorativos em excesso ou ações
  sem rótulo.

---

## 8. Fontes de verdade e precedência

Este briefing resume o estado atual e a direção visual para facilitar o trabalho do Jules. Em caso de
divergência:

1. O código e os contratos atuais definem o que está realmente implementado.
2. `docs/brand-identity.md` é a fonte normativa para tokens e identidade visual.
3. `docs/screens.md` é a referência para mapa de telas e mapeamento funcional com a API.
4. `docs/FUNCIONALIDADES.md` lista possibilidades e prioridades; itens futuros não são promessa de
   implementação.

Não remova nem contradiga essas fontes ao trabalhar neste redesign. Se uma decisão exigir mudança
funcional ou de backend, registre a lacuna em vez de simulá-la na interface.
