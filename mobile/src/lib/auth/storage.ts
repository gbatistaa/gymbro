import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * O mínimo que o storage precisa de um cofre. Um `SecureStore` real satisfaz; no teste, um objeto.
 */
export type SecureStoreLike = {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};

export type TokenStorage = {
  /** `false` quando a plataforma não tem cofre (web): a sessão não sobrevive a um reload. */
  canPersist: boolean;
  save(token: string): Promise<void>;
  read(): Promise<string | null>;
  clear(): Promise<void>;
};

const REFRESH_TOKEN_KEY = 'gymbro.refreshToken';

/**
 * Guarda **só** o refresh token. O access token vive em memória, de propósito: é o que impede um
 * dump de armazenamento de virar sessão válida sem passar pelo servidor.
 *
 * Sem driver (web), as operações são no-op e `canPersist` é `false` — não é erro, é a sessão que
 * acaba no reload. Tratar como falha levaria a uma tela de erro onde o correto é pedir login.
 */
export function createTokenStorage(driver: SecureStoreLike | null): TokenStorage {
  if (driver === null) {
    return {
      canPersist: false,
      save: async () => {},
      read: async () => null,
      clear: async () => {},
    };
  }

  return {
    canPersist: true,
    save: (token) => driver.setItemAsync(REFRESH_TOKEN_KEY, token),
    read: () => driver.getItemAsync(REFRESH_TOKEN_KEY),
    clear: () => driver.deleteItemAsync(REFRESH_TOKEN_KEY),
  };
}

/** Storage da plataforma atual. `expo-secure-store` não existe na web. */
export const refreshTokenStorage: TokenStorage = createTokenStorage(
  Platform.OS === 'web' ? null : SecureStore,
);
