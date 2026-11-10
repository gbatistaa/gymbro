import { createSessionRestorer, type SessionRestorer } from '@/lib/auth/bootstrap';
import { createAccessTokenRefresher, type AccessTokenRefresher } from '@/lib/auth/refresh';
import { clearSession, getSession, setSession } from '@/lib/auth/session';
import { refreshTokenStorage } from '@/lib/auth/storage';

import { createAuthApi, type AuthApi } from './auth';
import { createApiClient, resolveBaseUrl, type ApiClient } from './client';

let client: ApiClient | null = null;
let authApi: AuthApi | null = null;
let refresher: AccessTokenRefresher | null = null;
let restorer: SessionRestorer | null = null;

/**
 * Cliente **sem** renovação automática, para o próprio fluxo de autenticação.
 *
 * Se o refresh passasse pelo cliente que renova em 401, um refresh recusado chamaria o refresh de
 * novo — a recursão que a flag `skipAuthRefresh` evita nos endpoints e esta separação evita em
 * `currentUser`.
 */
function bareAuthApi(): AuthApi {
  return createAuthApi(createApiClient({ baseUrl: resolveBaseUrl() }));
}

function getRefresher(): AccessTokenRefresher {
  if (refresher !== null) {
    return refresher;
  }

  const bare = bareAuthApi();
  refresher = createAccessTokenRefresher({
    getRefreshToken: () => refreshTokenStorage.read(),
    requestRefresh: (refreshToken) => bare.refresh(refreshToken),
    onRefreshed: async (result) => {
      // o backend rotaciona o refresh token; guardar o antigo mataria a sessão no próximo boot
      await refreshTokenStorage.save(result.refreshToken);
      const current = getSession();
      if (current !== null) {
        setSession({
          ...current,
          accessToken: result.accessToken,
          expiresAt: Date.now() + result.expiresIn * 1000,
        });
      }
    },
    onRefused: () => clearSession(),
  });
  return refresher;
}

export function getApiClient(): ApiClient {
  if (client !== null) {
    return client;
  }

  client = createApiClient({
    baseUrl: resolveBaseUrl(),
    getAccessToken: () => getSession()?.accessToken ?? null,
    refreshAccessToken: getRefresher(),
  });
  return client;
}

export function getAuthApi(): AuthApi {
  authApi ??= createAuthApi(getApiClient());
  return authApi;
}

export function getSessionRestorer(): SessionRestorer {
  if (restorer !== null) {
    return restorer;
  }

  const bare = bareAuthApi();
  restorer = createSessionRestorer({
    readRefreshToken: () => refreshTokenStorage.read(),
    refresh: (refreshToken) => bare.refresh(refreshToken),
    currentUser: (accessToken) => bare.currentUser(accessToken),
    save: async (session, refreshToken) => {
      await refreshTokenStorage.save(refreshToken);
      setSession(session);
    },
    discard: () => clearSession(),
  });
  return restorer;
}
