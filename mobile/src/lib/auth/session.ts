import { atom, getDefaultStore } from 'jotai';

import { refreshTokenStorage } from './storage';

/** Perfil do usuário logado, vindo de `GET /api/users/me`. */
export type Profile = {
  id: string;
  name: string;
  email: string;
  timezone: string;
  createdAt: string;
};

export type Session = {
  /** Vive só em memória: não é persistido, não sobrevive a um reload. */
  accessToken: string;
  /** Epoch em ms em que o access token expira, para renovar antes de errar. */
  expiresAt: number;
  profile: Profile;
};

export const sessionAtom = atom<Session | null>(null);

/** Token atual, para o cliente HTTP ler fora de componente. */
export const accessTokenAtom = atom<string | null>((get) => get(sessionAtom)?.accessToken ?? null);

const store = getDefaultStore();

export function getSession(): Session | null {
  return store.get(sessionAtom);
}

export function setSession(session: Session): void {
  store.set(sessionAtom, session);
}

/**
 * Encerra a sessão: limpa o átomo e o refresh token do cofre.
 *
 * A ordem importa pouco, mas o storage vem depois de propósito: se a escrita falhar no nativo, o
 * estado em memória já foi limpo e o app não continua autenticado pela metade.
 */
export async function clearSession(): Promise<void> {
  store.set(sessionAtom, null);
  await refreshTokenStorage.clear();
}
