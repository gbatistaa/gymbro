# Implantação: backend nesta máquina, frontend na Vercel

```text
celular / navegador
        │  https://<projeto>.vercel.app
        ▼
Vercel (Next.js) ── /api/* (rewrite) ──► https://api.<seu-domínio>
                                               │ Cloudflare Tunnel (saída desta máquina,
                                               │ nenhuma porta aberta no roteador)
                                               ▼
                    ┌──────────── rede interna do Compose "gymbro" ────────────┐
                    │  tunnel (cloudflared) ──► backend:8080 (Spring Boot)     │
                    │                       └─► parser:8000  (FastAPI/docling) │
                    │  backend ── http://parser:8000/extract ──► parser        │
                    └──────────────────────────────────────────────────────────┘
https://parser.<seu-domínio> ──► túnel ──► parser:8000
```

- **Java → Python:** os dois contêineres estão na mesma rede do Compose, então o Java chama
  `http://parser:8000` pelo nome do serviço, com o cabeçalho `X-Parser-Token`.
- **Frontend → Java:** o navegador só fala com o domínio da Vercel. O `rewrites()` do
  `web/next.config.ts` repassa `/api/*` para `API_PROXY_TARGET`. Os cookies de sessão (`HttpOnly`,
  `Secure`, `SameSite=Strict`) ficam first-party, então o login funciona até no Safari do iPhone,
  que bloqueia cookies de terceiros. Por isso não há CORS envolvido.
- **Horário:** o `ops/scheduler.sh` derruba a stack inteira às **07:00** e sobe de novo às
  **16:20**, todos os dias. O túnel cai junto, e fora do horário as URLs públicas respondem com o
  erro de túnel indisponível da Cloudflare. O frontend continua na Vercel e mostra erro de conexão.

## 1. Segredos

| Arquivo | Para quê |
|---|---|
| `.env` (raiz) | `JWT_SECRET`, `PARSER_TOKEN`, `OPENROUTER_API_KEY`, `CLOUDFLARE_TUNNEL_TOKEN`, `COMPOSE_PROFILES`. Modelo em `.env.example`. |
| `backend/.env` | Banco (`DB_URL`, `DB_USER`, `DB_PASS`), fallback local, Cloudflare R2. |

Os dois estão no `.gitignore`. O `compose.yaml` se recusa a subir sem `JWT_SECRET` e `PARSER_TOKEN`.
Sem o `JWT_SECRET`, o Spring usaria o segredo padrão que está versionado no `application.yaml`.

## 2. Imagens e primeira subida

```bash
docker compose build          # gymbro-backend:local e gymbro-parser:local
docker compose up -d          # sobe backend e parser (o túnel entra no passo 3)
docker compose ps             # os dois devem ficar "healthy"
curl -fsS http://127.0.0.1:18080/api/health   # {"status":"UP"}
curl -fsS http://127.0.0.1:18000/health       # {"status":"ok"}
```

As portas locais (`18080`, `18000`) só escutam em `127.0.0.1` e servem para teste. O túnel entra
pela rede interna. Depois de mudar o código, rode `docker compose build` e `docker compose up -d` de
novo. O agendador não compila imagem.

> O fallback do banco aponta para `host.docker.internal:5432`. O Postgres desta máquina escuta só em
> `127.0.0.1`, então esse fallback não alcança o banco a partir do contêiner. O primário (Supabase)
> não é afetado.

## 3. Cloudflare Tunnel (URLs públicas)

Pré-requisito: um domínio adicionado à sua conta da Cloudflare (DNS gerenciado por ela).

1. Abra <https://one.dash.cloudflare.com> → **Networks → Tunnels → Create a tunnel** → **Cloudflared**.
2. Dê um nome (ex.: `gymbro`), escolha **Docker** e copie só o token (o texto depois de `--token`).
3. Na aba **Public Hostnames**, adicione:

   | Subdomínio | Domínio | Tipo | URL |
   |---|---|---|---|
   | `api` | `<seu-domínio>` | HTTP | `backend:8080` |
   | `parser` | `<seu-domínio>` | HTTP | `parser:8000` |

   Use os nomes dos serviços do Compose, e não `localhost` nem `host.docker.internal`.
4. No `.env` da raiz:

   ```bash
   CLOUDFLARE_TUNNEL_TOKEN=<token copiado>
   COMPOSE_PROFILES=tunnel
   ```

5. `docker compose up -d` e confira `docker compose logs tunnel`. Devem aparecer 4 linhas
   `Registered tunnel connection`.
6. Teste do celular, fora do Wi-Fi: `https://api.<seu-domínio>/api/health`.

O motor Python fica público, mas `/extract` e `/pdf-to-markdown` exigem o `X-Parser-Token`, e
`/docs` e `/openapi.json` ficam desligados (`PARSER_DOCS_ENABLED=false`). O Swagger do Java também
fica fechado (`OPENAPI_PUBLIC=false`).

## 4. Frontend na Vercel

1. Em <https://vercel.com/new>, importe o repositório do GitHub e defina **Root Directory = `web`**.
2. Em **Settings → Environment Variables** (Production e Preview):

   | Variável | Valor |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `/` |
   | `API_PROXY_TARGET` | `https://api.<seu-domínio>` |
   | `ENABLE_EXPERIMENTAL_COREPACK` | `1` (usa o pnpm fixado em `web/package.json`) |

3. Deploy. A partir daí, cada push na `main` publica em produção e cada branch ou PR ganha um preview.

O build falha de propósito com `NEXT_PUBLIC_API_URL=/` sem `API_PROXY_TARGET`, ou com destino sem
HTTPS. Assim, uma configuração errada não chega ao ar.

**Rollback:** no painel da Vercel → **Deployments** → deploy anterior → **Promote to Production**.

## 5. Agendador (07:00 desliga, 16:20 liga)

```bash
ops/schedulerctl.sh start      # roda em segundo plano, sobrevive ao fechar o terminal
ops/schedulerctl.sh status     # agendador, estado desejado agora e contêineres
ops/schedulerctl.sh logs       # acompanha o log
ops/schedulerctl.sh stop       # para o agendador (a stack fica como está)
ops/schedulerctl.sh autostart on   # opcional: inicia com o sistema (systemd do usuário)
```

- O agendador reconcilia a cada 30 s em vez de disparar num minuto exato. Funciona depois de o
  computador dormir ou reiniciar, e desfaz quem subir ou derrubar a stack na mão no horário errado.
  Para usar a stack fora do horário, rode `ops/schedulerctl.sh stop` antes.
- Os horários mudam por variável: `GYMBRO_STOP_AT=07:00 GYMBRO_START_AT=16:20 ops/schedulerctl.sh restart`.
- O log fica em `~/.local/state/gymbro/scheduler.log` e registra só as mudanças e os erros.
- Testes: `ops/tests/scheduler_test.sh` (usa um `docker` falso; não mexe na stack real).

## 6. Problemas comuns

| Sintoma | Causa provável |
|---|---|
| Página na Vercel mostra erro de conexão | Fora do horário (07:00–16:20) ou stack parada: `ops/schedulerctl.sh status`. |
| `api.<domínio>` responde 1033 ou 530 | Túnel desligado ou sem token: `docker compose logs tunnel`. |
| 502 vindo do túnel | Hostname aponta para o serviço errado ou contêiner não está `healthy`. |
| Import de bioimpedância falha | `docker compose logs parser`; o `PARSER_TOKEN` precisa ser o mesmo para os dois serviços. |
| Agendador não sobe a stack às 16:20 | Imagens não construídas (`docker compose build`) ou Docker parado: `ops/schedulerctl.sh logs`. |
