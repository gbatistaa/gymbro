import type { NextConfig } from "next";

/**
 * Proxy da API para o deploy na Vercel.
 *
 * Com `API_PROXY_TARGET` (variável só do build, ex.: `https://api.seudominio.com`), o site repassa
 * `/api/*` para o backend. Junto com `NEXT_PUBLIC_API_URL=/`, o navegador só fala com a origem do
 * site: os cookies HttpOnly da sessão ficam first-party e o CORS deixa de existir. Sem a variável,
 * nada muda (desenvolvimento local chama a API direto).
 */
function apiProxyTarget(): string | null {
  const raw = process.env.API_PROXY_TARGET?.trim();
  if (!raw) {
    if (process.env.NEXT_PUBLIC_API_URL?.trim() === "/") {
      throw new Error("NEXT_PUBLIC_API_URL=/ precisa de API_PROXY_TARGET com a URL pública do backend.");
    }
    return null;
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`API_PROXY_TARGET não é uma URL válida: "${raw}".`);
  }

  const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(isLocalhost && url.protocol === "http:")) {
    throw new Error("API_PROXY_TARGET precisa usar https (http só para localhost).");
  }
  if (url.pathname !== "/" || url.search !== "") {
    throw new Error("API_PROXY_TARGET deve ser só a origem do backend, sem caminho (ex.: https://api.seudominio.com).");
  }
  return url.origin;
}

const proxyTarget = apiProxyTarget();

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  async rewrites() {
    return proxyTarget ? [{ source: "/api/:path*", destination: `${proxyTarget}/api/:path*` }] : [];
  },
};

export default nextConfig;
