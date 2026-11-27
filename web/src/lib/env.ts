import { z } from "zod";

/**
 * `NEXT_PUBLIC_API_URL` aceita uma URL absoluta da API ou `/`. Com `/`, o navegador chama a própria
 * origem do site e o `rewrites()` do `next.config.ts` repassa `/api/*` para `API_PROXY_TARGET`. É o
 * modo da Vercel: os cookies HttpOnly ficam first-party e funcionam até no Safari do iPhone.
 */
const SAME_ORIGIN = "/";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .union([z.literal(SAME_ORIGIN), z.url({ protocol: /^https?$/ })])
    .default("http://localhost:8080")
    // "/" vira "": as rotas da API já começam com "/api"
    .transform((value) => value.replace(/\/+$/, "")),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function parsePublicEnv(raw: { NEXT_PUBLIC_API_URL?: string }): PublicEnv {
  const parsed = publicEnvSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid public environment variables:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

// acesso literal a process.env.NEXT_PUBLIC_*: é o que o Next substitui no build
export const env = parsePublicEnv({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});
