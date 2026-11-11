# Gymbro — Identidade visual e style guide

Fonte de verdade visual e de experiência para o PWA Gymbro. Independente de framework: cores,
tipografia, comportamento e navegação devem ser implementados com os recursos do stack web escolhido.

Última atualização: direção visual PWA — escuro, verde e azul.

---

## 0. O produto em uma frase

> O caderno de treino de quem já treina: registra carga, série e volume sem atrito e devolve a
> próxima decisão de progressão.

O valor está no número correto na hora certa. A interface pode ter mais presença visual, mas nunca
à custa de clareza, velocidade ou confiança. Sem motivação genérica, confete ou decoração que
compita com os dados.

---

## 1. Posicionamento

| Dimensão | Decisão |
| --- | --- |
| Usuário central | Intermediário, 1 a 3 anos de treino; conhece PR, volume e deload. |
| Sensação | Ferramenta séria, precisa e confiável, com energia visual controlada. |
| Plataforma | PWA web, mobile-first, escuro no MVP. Tema claro futuro terá paleta própria. |
| Marca | Gymbro, wordmark tipográfico. |
| Idioma e unidade | PT-BR, kg, decimal com vírgula (`42,5 kg`). |
| Navegação autenticada | Início, Treinar, Progresso, Perfil. Barra inferior no mobile. |

### Contexto de uso

Uso durante o treino, muitas vezes com uma mão livre, dedo suado, luz forte e sinal instável. Toques
desnecessários e números ambíguos são erros de experiência, não detalhes estéticos. A interface
deve ser legível, responsiva, tolerante a conexão instável e rápida de operar.

### Não fazer

- Âmbar como acento, gradiente roxo, glassmorphism como superfície padrão ou cards com borda lateral colorida.
- Copy motivacional (“supere seus limites”, “desbloqueie”, “transforme-se”).
- Gamificação, confete ou ilustração de atleta como recompensa ou conteúdo principal.
- Emoji como ícone; ícone sem rótulo em ação destrutiva; formulários sem labels visíveis.
- Usar verde e azul de forma intercambiável para comunicar o mesmo estado.

---

## 2. Direção visual

### Style guide: caderno técnico com energia

O sistema combina a estrutura editorial de um registro de treino com uma presença mais viva. O
“caderno” continua sendo a assinatura: linhas, colunas numéricas alinhadas e anotações compactas.
O caráter mais vivo vem do contraste entre preto profundo, verde elétrico nas ações e azul limpo
em informação, além de uma camada gráfica discreta nas telas de entrada — não de cartões coloridos
ou efeitos espalhados por todas as telas.

- **Superfícies:** planas, escuras e organizadas por níveis de fundo e linhas finas; sombras só para
  sobreposição que realmente precise de elevação.
- **Destaque:** uma ação primária evidente por contexto. Na tela de treino, o dado ativo pode ganhar
  escala; nas demais telas, a hierarquia vem de tipografia e espaçamento.
- **Textura de marca:** linhas de registro, pequenas etiquetas mono e um brilho radial verde/azul
  muito sutil somente em fundos de autenticação. Não usar como fundo de conteúdo ou como gradiente
  de botão.
- **Forma:** cantos firmes e raio pequeno. Evitar o aspecto de dashboard montado com cards idênticos.
- **Ícones:** uma família consistente de ícones SVG (por exemplo, Lucide), traço simples; sempre
  acompanhados por rótulos quando a função não for universalmente óbvia.

### Dials por contexto

| Contexto | Variação | Movimento | Densidade |
| --- | --- | --- | --- |
| Entrar / criar conta | Média, com assinatura visual discreta | Baixa | Baixa |
| Treino ao vivo / PR | Alta, concentrada no número ativo | Média | Alta |
| Rotinas / perfil | Baixa | Mínima | Média |
| Histórico / relatório | Baixa | Mínima | Alta |

---

## 3. Elemento-assinatura: caderno de treino

1. **Régua, não caixa.** Dados vivem em linhas separadas por `rule`; cards com sombra são exceção.
2. **Número tabular e alinhado à direita.** Carga, reps, séries, volume e percentuais usam IBM Plex
   Mono ou fonte mono equivalente, com alinhamento à direita.
3. **Anotação na margem.** Variação, `+2,5 kg`, `RPE 8` e `há 6 d` usam a fonte mono, pequena e
   legível, alinhada em uma gutter consistente.
4. **Cabeçalho de seção editorial.** Label mono em caixa alta, seguida por uma régua que completa
   a linha; sem ícone decorativo.
5. **Um único numeral gigante por tela.** Reservado para o valor da série ativa no treino.

Essa assinatura é disciplina de composição, não textura: deve continuar reconhecível sem efeitos.

---

## 4. Cor

### Paleta escura (MVP)

| Token | Hex | Uso |
| --- | --- | --- |
| `canvas` | `#080B0A` | Fundo principal, preto com leve matiz verde. |
| `surface` | `#101715` | Navegação inferior, grupos e superfícies discretas. |
| `raised` | `#18221D` | Campos, botão secundário e estado pressionado neutro. |
| `border` | `#29352E` | Contornos decorativos de superfície. |
| `rule` | `#35443B` | Separadores de dados. |
| `borderStrong` | `#8AA99A` | Foco visível e contorno funcional. |
| `textMuted` | `#A6B5AC` | Anotações e texto auxiliar; não usar para texto essencial sem conferir contraste. |
| `textSecondary` | `#C6D2CC` | Corpo secundário e unidades. |
| `textPrimary` | `#F1F7F3` | Texto principal. |
| `accent` | `#4ADE80` | Verde: ação primária, série concluída, progresso positivo. |
| `accentPressed` | `#22C55E` | Verde em estado pressionado. |
| `accentTint` | `#10271A` | Realce de seleção ou linha em progresso. |
| `info` | `#60A5FA` | Azul: links, informação, navegação contextual e dados informativos. |
| `infoTint` | `#101F32` | Fundo discreto para conteúdo informativo azul. |
| `danger` | `#F87171` | Erro, exclusão e ação destrutiva; nunca decorativo. |
| `onAccent` | `#07110A` | Texto/ícone escuro sobre botão verde. |

Papéis são semânticos: verde significa ação/progresso; azul significa informação/link. O azul não
substitui o verde em botões primários ou séries concluídas. Vermelho é reservado para erro ou
destruição. Não depender só da cor para comunicar estados: incluir texto, ícone ou forma.

Contraste deve ser verificado para cada par real de texto/fundo conforme WCAG AA: 4,5:1 para texto
normal e 3:1 para texto grande e elementos gráficos relevantes. `rule` e bordas decorativas não
precisam funcionar como texto. Não declarar contraste aprovado sem medir o par em uso.

### Tema claro (futuro)

Será uma paleta própria, com fundo de papel e tinta escura. Não inverter os tokens da paleta escura;
revalidar contraste e estados antes de disponibilizar.

---

## 5. Tipografia

**Famílias:** IBM Plex Sans para interface e IBM Plex Mono para números e anotações. Manter duas
famílias; se não estiverem disponíveis localmente, usar fallback sans-serif/monospace equivalente.

| Token | Família | Tamanho / linha | Peso | Uso |
| --- | --- | --- | --- | --- |
| `label` | Mono | 12 / 16 | 500 | Seções, chips e notas; caixa alta, tracking `0.08em`. |
| `caption` | Sans | 13 / 18 | 400 | Ajuda, metadados e dicas. |
| `body` | Sans | 16 / 24 | 400 | Texto padrão e nomes de exercício. |
| `bodyStrong` | Sans | 16 / 24 | 600 | Valor ou exercício ativo. |
| `title3` | Sans | 19 / 26 | 600 | Seção e diálogo. |
| `title2` | Sans | 23 / 30 | 600 | Título de tela. |
| `title1` | Sans | 28 / 32 | 600 | Título principal. |
| `display` | Sans | 34 / 38 | 600 | Métrica de destaque fora do treino ao vivo. |
| `numeral` | Mono | 56 / 56 | 500 | Edição de carga ou reps. |
| `numeralXL` | Mono | 88 / 84 | 500 | Um valor ativo na tela de treino. |

Tracking dos numerais: `-0.02em`; corpo: `0`. Peso máximo `600`, sem itálico. Alinhar número e
unidade pela linha de base (`42,5` + `kg`). Decimal com vírgula; milhar com ponto (`12.480 kg`).
Texto corrido deve ter medida confortável, idealmente até 68 caracteres por linha.

### Marca

`GYMBRO` em Plex Sans SemiBold, caixa alta, tracking `-0.02em`, cor `textPrimary`; sem mascote ou
ponto final. Ícone PWA: letra `G` tipográfica em `accent` sobre `canvas`, com respiro amplo. Não
reintroduzir o âmbar.

---

## 6. Layout, espaçamento e forma

### Espaçamento

Escala base 4: `2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64`. Gutter lateral de 20px no mobile, 32px
em telas maiores; conteúdo com largura máxima de 640px nas telas de leitura/formulário. Alvos de
toque com pelo menos 48×48px e espaçamento suficiente para evitar toques acidentais.

| Uso | Valor |
| --- | --- |
| Gutter lateral mobile | 20px |
| Linha de dado | 16px vertical; régua até a borda do conteúdo |
| Label até campo | 8px |
| Espaço entre campos | 20px |
| Padding de painel/modal | 20px |
| Alvo de toque | mínimo 48×48px |

### Raios e elevação

`2px` chip/tag · `6px` campo/botão · `10px` painel pequeno · `16px` modal · `999px` apenas pílula
ou indicador. Sem sombra em superfície comum; elevar apenas menus, diálogos e overlays.

### Responsividade

Projetar primeiro para 320–430px, sem rolagem horizontal. Em telas maiores, limitar a coluna de
conteúdo e usar o espaço adicional sem esticar formulários ou dados. Respeitar safe areas do
navegador e reservar espaço para a barra inferior fixa. Conferir pelo menos 320, 375, 768 e 1024px.

---

## 7. Autenticação, rotas e navegação

### Antes de autenticar

- `/signin` é a tela de entrada padrão para quem não tem sessão válida.
- `/signup` permite criar conta e oferece retorno claro para signin.
- Login e cadastro são páginas simples, focadas na tarefa, com labels persistentes, erros junto ao
  campo, estado de envio e feedback para sucesso/falha. Nunca usar placeholder como único label.
- Uma rota privada sem sessão não pode renderizar dados ou controles privados. O guard do cliente
  encaminha para `/signin` e pode preservar o destino pretendido para depois do login.
- Ao abrir uma rota privada diretamente ou atualizar a página, validar a sessão antes de mostrar
  conteúdo autenticado. Durante a validação, exibir estado de carregamento neutro, não conteúdo
  privado nem um flash da tela de destino.

### Contrato com o backend

O PWA controla navegação e apresentação; isso não substitui autorização no servidor. APIs privadas
devem validar a sessão em cada requisição e responder `401 Unauthorized` quando ela estiver ausente
ou inválida (`403` para usuário autenticado sem permissão). O cliente limpa/atualiza o estado de
sessão e encaminha para `/signin` em caso de `401`. Endpoints de página servidos pelo backend podem
redirecionar para signin se esse for o modelo de entrega, mas APIs não devem devolver HTML de login
como substituto de resposta de erro. Nunca confiar apenas no guard de frontend para proteger dados.

### Navegação autenticada

- Quatro destinos: **Início**, **Treinar**, **Progresso**, **Perfil**.
- Mobile: barra inferior fixa, considerando safe area, com ícone e rótulo visível em cada aba; aba
  ativa indicada por cor e forma/peso além da cor. Cada destino tem alvo de pelo menos 48×48px.
- Ícones sem rótulo acessível não são permitidos. A navegação funciona por teclado e leitor de tela;
  estado ativo é exposto semanticamente.
- Em telas largas, a navegação pode se adaptar a uma barra lateral ou cabeçalho, mantendo destinos,
  rótulos e hierarquia. A navegação não pode ocupar área de conteúdo do treino.
- Cada rota autenticada suporta deep link e recarregamento sem perder o destino; o guard continua
  sendo aplicado.

---

## 8. Ícones, estados e feedback

Use uma família consistente de ícones SVG, tamanhos de 16, 20 ou 24px e cor herdada do token. Ícone
decorativo é oculto de tecnologias assistivas; ícone de ação tem nome acessível. Nunca usar emoji.
Estados vazios são texto curto mais uma ação útil, sem ilustração obrigatória.

| Estado | Regra |
| --- | --- |
| Padrão | Texto `textPrimary`, estrutura legível e separadores `rule`. |
| Hover | Em dispositivos com hover, realce discreto sem depender dele para descobrir ações. |
| Pressionado | Fundo/tom `raised` ou token semântico; feedback imediato. |
| Foco visível | Contorno de pelo menos 2px, offset visível; nunca remover outline sem substituto. |
| Desabilitado | Aparência distinta e estado semântico correto; manter texto legível. |
| Carregando | Informar que a ação está em andamento e evitar envio duplicado; reservar espaço. |
| Vazio | Uma frase clara e uma ação em `accent` ou link `info`. |
| Erro | Mensagem junto ao campo, instrução acionável e contorno `danger`; associar ao campo. |

Botão primário: verde, texto `onAccent`, largura total em formulário e altura mínima 48px, raio 6px.
Secundário: superfície `raised` e texto principal. Destrutivo: `danger`, confirmação quando houver
perda de dados. Erros e sucesso devem ter texto/ícone além da cor.

---

## 9. Movimento

| Situação | Duração | Curva |
| --- | --- | --- |
| Foco, hover, pressão | 120ms | ease-out |
| Mudança de linha/chip/estado | 160ms | ease-out |
| Entrada de diálogo | 200ms | ease-out |
| Saída de diálogo | 160ms | ease-in |
| Troca de numeral | até 180ms, deslocamento vertical sutil | ease-out |

Animar preferencialmente `transform` e `opacity`; não animar dimensões/layout. Sem bounce ou
confete. Respeitar `prefers-reduced-motion: reduce`, removendo deslocamento e transições não
essenciais. O movimento deve explicar mudança de estado, não atrasar o registro de uma série.

---

## 10. Tokens de referência para web

Valores de cor e geometria em propriedades CSS reutilizáveis (ou tokens equivalentes no framework):

```css
:root {
  color-scheme: dark;
  --color-canvas: #080B0A;
  --color-surface: #101715;
  --color-raised: #18221D;
  --color-border: #29352E;
  --color-rule: #35443B;
  --color-border-strong: #8AA99A;
  --color-text-muted: #A6B5AC;
  --color-text-secondary: #C6D2CC;
  --color-text-primary: #F1F7F3;
  --color-accent: #4ADE80;
  --color-accent-pressed: #22C55E;
  --color-accent-tint: #10271A;
  --color-info: #60A5FA;
  --color-info-tint: #101F32;
  --color-danger: #F87171;
  --color-on-accent: #07110A;
  --radius-chip: 2px;
  --radius-control: 6px;
  --radius-panel: 10px;
  --radius-modal: 16px;
  --content-max: 640px;
  --tap-target-min: 48px;
}
```

Fontes IBM Plex devem ser servidas de forma compatível com o PWA (preferir arquivos locais/otimizados
para evitar dependência de rede durante o treino). Números devem usar `font-variant-numeric: tabular-nums`
como reforço, mesmo com fonte mono.

---

## 11. Checklist antes de publicar uma tela

- [ ] Em três segundos, está claro o que a tela faz.
- [ ] A hierarquia ainda funciona sem decoração ou cor.
- [ ] Números usam mono/tabular, alinham à direita e seguem formato PT-BR.
- [ ] Uma lista de dados usa régua, não uma pilha de cards com sombra.
- [ ] Pares de texto/fundo atendem WCAG AA; foco é visível.
- [ ] Há labels, erros associados aos campos, loading e proteção contra envio duplicado.
- [ ] A tela funciona com teclado, leitor de tela e `prefers-reduced-motion`.
- [ ] Em 320px não há overflow; alvos de toque têm pelo menos 48×48px.
- [ ] A barra inferior respeita safe area e não encobre conteúdo.
- [ ] Estados e navegação não dependem apenas de verde/azul ou apenas de ícones.
- [ ] Nenhuma tela privada aparece antes de a sessão ser validada.
- [ ] Nenhum emoji, copy motivacional, âmbar ou gamificação decorativa.

---

## 12. Sequência de implementação visual

1. Implementar tokens CSS e carregar IBM Plex Sans/Mono.
2. Criar primitivos reutilizáveis: texto por escala, régua, linha de dado, label, botão e numeral.
3. Construir signin/signup e estados de formulário; aplicar o guard de rotas privadas e o contrato
   de sessão com a API.
4. Construir casca autenticada com as quatro abas e navegação responsiva.
5. Construir a tela de treino ao vivo, concentrando nela o numeral e a maior densidade.
6. Construir Início, Progresso e Perfil; revisar acessibilidade, contraste e estados em cada tela.
