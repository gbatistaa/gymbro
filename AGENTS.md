# Gymbro — Instruções do projeto

Instruções normativas para agentes neste repositório. O `backend/` é Spring Boot 4; o `web/` é o
PWA Next.js. `web/AGENTS.md` contém regras específicas da versão do Next e deve ser lido antes de
alterar o frontend.

## Stack do frontend

- Next.js 16 (App Router), React 19 e TypeScript em modo `strict`.
- pnpm como gerenciador de pacotes.
- Zod para contratos e validação em runtime.
- Jotai para estado compartilhado no cliente.
- Axios para HTTP, centralizado em `web/src/lib/http.ts`.

## Regras obrigatórias do frontend

### Clean code

- Funções e componentes pequenos, com uma responsabilidade clara.
- Nomes explícitos; sem abreviações obscuras, código morto, comentários redundantes ou duplicação.
- Proibido `any`, `@ts-ignore` e `@ts-expect-error` sem justificativa técnica no mesmo commit.
- Prefira código direto a abstrações prematuras. Uma abstração só entra quando há reuso real ou uma
  regra de negócio compartilhada.
- Erros e estados de carregamento/vazio devem ser tratados, não ignorados.

### Reusabilidade e componentização

- Antes de criar algo, procure um componente, hook ou utilitário existente.
- Primitivos visuais reutilizáveis ficam em `web/src/components/ui/`; componentes de uma feature
  ficam junto da feature em `web/src/features/<feature>/`.
- Cada componente tem uma responsabilidade. Separe container (dados/ações) de apresentação quando
  isso reduzir acoplamento, sem criar camadas cerimoniais.
- Server Components são o padrão. Use `"use client"` apenas quando precisar de estado, efeitos,
  eventos do navegador ou APIs do cliente, e mantenha a fronteira o mais baixa possível.
- Evite repassar a mesma prop por muitos níveis. Prefira composição (`children`) ou um átomo Jotai.
- Siga a identidade visual e os tokens de `docs/brand-identity.md`; não introduza cores, fontes ou
  estilos fora do guia.

### Estado com Jotai

- Jotai é o padrão para estado compartilhado no cliente. Não adicione Redux, Zustand ou Context para
  estado global sem aprovação explícita.
- Átomos ficam em `web/src/stores/` e devem representar estado, não efeitos colaterais de render.
- Use `useState`/`useReducer` para estado local e efêmero de um único componente; promova para Jotai
  quando o estado precisar ser compartilhado ou sobreviver à navegação.
- Prefira átomos derivados (`atom((get) => ...)`) a sincronizar valores manualmente.
- O `Provider` do Jotai já existe em `web/src/providers/app-providers.tsx`; não crie outro provider
  global.

### Contratos tipados com Zod

- Toda fronteira externa é tipada e validada com Zod: respostas e payloads de API, formulários,
  variáveis de ambiente, parâmetros de rota/query e dados persistidos.
- Schemas ficam em `web/src/contracts/` (por domínio) e os tipos são inferidos com `z.infer`.
  Nunca duplique manualmente um tipo que já pode ser inferido do schema.
- Use `request(config, schema)` de `web/src/lib/http.ts` para validar a resposta em runtime.
- Não use cast (`as`) para contornar um contrato. Corrija o schema ou trate o caso.
- Mensagens de validação são em PT-BR e devem ser acionáveis.

### HTTP e autenticação

- Não crie instâncias de Axios ou chamadas `fetch` avulsas. Use o cliente de `web/src/lib/http.ts`.
- Tokens de sessão ficam em cookies `HttpOnly` definidos pelo backend. O PWA nunca lê, persiste ou
  envia access token em `Authorization: Bearer`; o Jotai guarda apenas os dados públicos do usuário.
- Respostas `401` tentam um refresh via cookie uma única vez. Se falhar, limpe a sessão e vá para
  `/signin`, preservando o destino em `?next=`. O interceptor de `web/src/lib/http.ts` cuida disso.
- Rotas privadas não podem renderizar dados antes de a sessão ser validada; o cliente nunca é a
  autorização final. O backend continua responsável por validar cada requisição.
- CORS com credenciais exige origens explícitas; nunca use `*` com cookies.
- Segredos nunca usam o prefixo `NEXT_PUBLIC_`. Apenas `web/.env.example` é versionado.

## Estrutura de referência

```text
web/src/
  app/            rotas, layouts e páginas (App Router)
  components/ui/  primitivos reutilizáveis
  features/       componentes e hooks por domínio
  contracts/      schemas Zod e tipos inferidos
  lib/            clientes e utilitários sem UI (http, env)
  providers/      providers globais (Jotai)
  stores/         átomos Jotai
```

## Verificação antes de concluir uma tarefa de frontend

```bash
cd web
pnpm lint
pnpm typecheck
pnpm build
```

Se uma alteração exigir mudança no backend (por exemplo, CORS para `http://localhost:3000`), registre
isso explicitamente em vez de esconder o problema no cliente.
