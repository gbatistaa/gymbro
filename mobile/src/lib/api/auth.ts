import type { Profile } from '@/lib/auth/session';

import type { ApiClient, ApiRequestOptions } from './client';
import { ApiError } from './error';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  /** Segundos até o access token expirar, como o backend informa. */
  expiresIn: number;
};

export type Credentials = {
  email: string;
  password: string;
};

export type Registration = {
  name: string;
  email: string;
  password: string;
};

/** O contrato gerado marca tudo como opcional; validar aqui evita `Bearer undefined` no header. */
type RawAuthTokens = {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
};

export type AuthApi = {
  login(credentials: Credentials): Promise<AuthTokens>;
  register(registration: Registration): Promise<Profile>;
  refresh(refreshToken: string): Promise<AuthTokens>;
  logout(refreshToken: string): Promise<void>;
  currentUser(accessToken?: string): Promise<Profile>;
};

export function createAuthApi(client: ApiClient): AuthApi {
  return {
    login: (credentials) =>
      client
        .request<RawAuthTokens>('/api/auth/login', { method: 'POST', body: credentials, skipAuthRefresh: true })
        .then(toAuthTokens),

    register: (registration) =>
      client.request<Profile>('/api/auth/register', {
        method: 'POST',
        body: registration,
        skipAuthRefresh: true,
      }),

    refresh: (refreshToken) =>
      client
        .request<RawAuthTokens>('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
        skipAuthRefresh: true,
      })
        .then(toAuthTokens),

    logout: (refreshToken) =>
      client.request<void>('/api/auth/logout', {
        method: 'POST',
        body: { refreshToken },
        skipAuthRefresh: true,
      }),

    // `accessToken` opcional para o caso logo-após-login, quando a sessão ainda não existe
    currentUser: (accessToken) =>
      client.request<Profile>('/api/users/me', tokenOption(accessToken)),
  };
}

function tokenOption(accessToken?: string): ApiRequestOptions {
  return accessToken === undefined ? {} : { token: accessToken };
}

function toAuthTokens(raw: RawAuthTokens): AuthTokens {
  const { accessToken, refreshToken, expiresIn } = raw;
  if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
    throw new ApiError({
      code: 'UNEXPECTED_RESPONSE',
      status: 200,
      message: 'Resposta de autenticação sem os tokens esperados',
    });
  }
  return {
    accessToken,
    refreshToken,
    expiresIn: typeof expiresIn === 'number' ? expiresIn : 0,
  };
}
