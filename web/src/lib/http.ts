import axios, { type AxiosRequestConfig } from "axios";
import type { z } from "zod";
import { env } from "@/lib/env";

export const http = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: { Accept: "application/json" },
});

type UnauthorizedHandler = (next: string) => void;

let handleUnauthorized: UnauthorizedHandler | null = null;

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
  if (!handleUnauthorized) return;

  const { pathname, search } = window.location;
  if (pathname === "/signin" || pathname === "/signup") return;

  handleUnauthorized(`${pathname}${search}`);
}

http.interceptors.response.use(undefined, (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    redirectToSignIn();
  }

  return Promise.reject(error);
});

export async function request<T>(
  config: AxiosRequestConfig,
  schema: z.ZodType<T>,
): Promise<T> {
  const response = await http.request<unknown>(config);
  return schema.parse(response.data);
}
