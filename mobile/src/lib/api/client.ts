import { networkError, parseErrorResponse } from './error';

/** O mínimo que o cliente usa de uma resposta HTTP. Um `Response` real satisfaz. */
export type FetchResponse = {
  status: number;
  text(): Promise<string>;
  headers?: { get(name: string): string | null };
};

export type FetchLike = (url: string, init: RequestInit) => Promise<FetchResponse>;

export type ApiClientOptions = {
  /** Origem da API, sem barra no fim. Use `resolveBaseUrl()` para ler do ambiente. */
  baseUrl: string;
  /** Devolve o access token atual, ou null quando não há sessão. */
  getAccessToken?: () => string | null;
  /**
   * Renova o access token quando a resposta é 401. Deve devolver o token novo, ou null quando a
   * sessão não pode mais ser renovada. A coalescência de chamadas paralelas é responsabilidade
   * dele (`createAccessTokenRefresher`), não do cliente.
   */
  refreshAccessToken?: () => Promise<string | null>;
  timeoutMs?: number;
  /** Injetável para teste; por padrão usa o `fetch` global. */
  fetchImpl?: FetchLike;
};

export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Objeto serializado como JSON. `undefined` não envia corpo. */
  body?: unknown;
  timeoutMs?: number;
  /**
   * Token explícito para esta chamada, ignorando a sessão.
   *
   * Existe por um caso real: logo após o login é preciso buscar o perfil com o token recém-recebido,
   * antes de a sessão existir no estado.
   */
  token?: string | null;
  /**
   * Desliga a renovação automática neste request.
   *
   * Obrigatório em `/api/auth/*`: um 401 de login significa "senha errada", não "token expirado".
   * Sem isto, uma senha errada tentaria renovar a sessão de quem já está logado.
   */
  skipAuthRefresh?: boolean;
};

export type ApiClient = {
  request<T>(path: string, options?: ApiRequestOptions): Promise<T>;
};

const DEFAULT_TIMEOUT_MS = 15_000;
const UNAUTHORIZED = 401;
const ENV_VAR = 'EXPO_PUBLIC_API_URL';

/**
 * Lê a origem da API de `EXPO_PUBLIC_API_URL`.
 *
 * Falha alto quando a variável não existe: adivinhar `localhost` funciona no simulador iOS e
 * quebra no emulador Android (que precisa de `10.0.2.2`) — o erro de rede resultante apontaria
 * para o lugar errado.
 */
export function resolveBaseUrl(): string {
  const value = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!value) {
    throw new Error(
      `${ENV_VAR} is not set. Create mobile/.env from mobile/.env.example — ` +
        'use http://10.0.2.2:8080 on the Android emulator, http://localhost:8080 on the iOS simulator, ' +
        'or your machine LAN IP on a physical device.',
    );
  }
  return value.replace(/\/+$/, '');
}

/**
 * Cliente HTTP da API.
 *
 * Erro nunca chega como `SyntaxError` na tela: resposta não-JSON vira `ApiError` com código
 * derivado do status, e falha de transporte vira `NETWORK`. Token e corpo nunca são logados.
 *
 * Um 401 dispara **uma** tentativa de renovação e **uma** repetição da requisição. Se a repetição
 * também falhar com 401, o erro sobe — repetir de novo transformaria token inválido em loop.
 */
export function createApiClient({
  baseUrl,
  getAccessToken,
  refreshAccessToken,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  fetchImpl,
}: ApiClientOptions): ApiClient {
  const base = baseUrl.replace(/\/+$/, '');
  const doFetch: FetchLike = fetchImpl ?? ((url, init) => fetch(url, init));

  return {
    async request<T>(path: string, options: ApiRequestOptions = {}) {
      const { method = 'GET', body, timeoutMs: perRequest } = options;
      const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
      const payload = body === undefined ? undefined : JSON.stringify(body);

      const send = async (token: string | null): Promise<FetchResponse> => {
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        if (payload !== undefined) {
          headers['Content-Type'] = 'application/json';
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), perRequest ?? timeoutMs);

        try {
          return await doFetch(url, { method, headers, body: payload, signal: controller.signal });
        } catch {
          // a origem vai na mensagem para o erro apontar para o endereço, não para o wifi
          throw networkError(originOf(url));
        } finally {
          clearTimeout(timer);
        }
      };

      const initialToken = options.token !== undefined ? options.token : (getAccessToken?.() ?? null);
      let response = await send(initialToken);

      if (response.status === UNAUTHORIZED && refreshAccessToken && !options.skipAuthRefresh) {
        const refreshed = await refreshAccessToken();
        if (refreshed !== null) {
          response = await send(refreshed);
        }
      }

      let text: string;
      try {
        text = await response.text();
      } catch {
        throw networkError();
      }

      if (response.status >= 200 && response.status < 300) {
        return (text.length > 0 ? parseJson(text) : undefined) as T;
      }

      throw parseErrorResponse(
        response.status,
        parseJson(text),
        readRetryAfterSeconds(response.headers),
      );
    },
  };
}

/** Esquema + host + porta, sem o caminho: é o que se confere quando a API está inalcançável. */
function originOf(url: string): string {
  const match = /^[a-z][a-z0-9+.-]*:\/\/[^/]+/i.exec(url);
  return match?.[0] ?? url;
}

/** `Retry-After` só interessa no 429; valor não numérico é ignorado. */
function readRetryAfterSeconds(headers: FetchResponse['headers']): number | undefined {
  const raw = headers?.get('retry-after');
  if (raw === undefined || raw === null) {
    return undefined;
  }
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
}

/** JSON inválido vira `undefined`: o chamador decide o fallback, nada explode aqui. */
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
