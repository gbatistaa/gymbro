import axios, {
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import type { z } from "zod";
import { env } from "@/lib/env";
import { SESSION_STORAGE_KEY } from "@/stores/session";

export const http = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

type UnauthorizedHandler = (next: string) => void;
type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

let handleUnauthorized: UnauthorizedHandler | null = null;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Registers the navigation handler used when the API responds with 401.
 * Must be called from a Client Component that has access to `useRouter()`,
 * so the navigation goes through the Next.js router instead of
 * `window.location.assign()`.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  handleUnauthorized = handler;
}

function redirectToSignIn() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(SESSION_STORAGE_KEY);

  const { pathname, search } = window.location;
  if (pathname === "/signin" || pathname === "/signup") return;

  if (handleUnauthorized) {
    handleUnauthorized(`${pathname}${search}`);
  }
}

function isAuthEndpoint(url: string | undefined) {
  return (
    url === "/api/auth/login" ||
    url === "/api/auth/register" ||
    url === "/api/auth/refresh"
  );
}

async function refreshSession(): Promise<boolean> {
  try {
    await axios.post(`${env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, null, {
      withCredentials: true,
    });
    return true;
  } catch {
    return false;
  }
}

function refreshOnce(): Promise<boolean> {
  refreshPromise ??= refreshSession().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

http.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error) || error.response?.status !== 401) {
    return Promise.reject(error);
  }

  const config = error.config as RetryableConfig | undefined;

  if (!config || isAuthEndpoint(config.url) || config._retried) {
    if (!isAuthEndpoint(config?.url)) redirectToSignIn();
    return Promise.reject(error);
  }

  config._retried = true;

  if (!(await refreshOnce())) {
    redirectToSignIn();
    return Promise.reject(error);
  }

  return http.request(config);
});

export async function request<T>(
  config: AxiosRequestConfig,
  schema: z.ZodType<T>,
): Promise<T> {
  const response = await http.request<unknown>(config);
  return schema.parse(response.data);
}

/**
 * Igual a `request`, mas aceita ausência de corpo: `204` é resposta válida, não erro.
 * Ex.: `GET /api/sessions/active` devolve `204` quando não há sessão em andamento.
 */
export async function requestMaybe<T>(
  config: AxiosRequestConfig,
  schema: z.ZodType<T>,
): Promise<T | null> {
  const response = await http.request<unknown>(config);

  if (
    response.status === 204 ||
    response.data === "" ||
    response.data === null ||
    response.data === undefined
  ) {
    return null;
  }

  return schema.parse(response.data);
}
