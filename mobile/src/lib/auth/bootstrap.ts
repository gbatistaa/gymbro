import type { AuthTokens } from '@/lib/api/auth';

import type { Profile, Session } from './session';

type RestorerOptions = {
  readRefreshToken(): Promise<string | null>;
  refresh(refreshToken: string): Promise<AuthTokens>;
  currentUser(accessToken: string): Promise<Profile>;
  /** Persiste a sessão e o refresh token rotacionado. */
  save(session: Session, refreshToken: string): Promise<void>;
  /** Sessão irrecuperável: limpar storage. */
  discard(): Promise<void>;
};

export type SessionRestorer = () => Promise<void>;

/**
 * Restaura a sessão no boot a partir do refresh token guardado.
 *
 * Não é conveniência: sem isto o refresh token fica no cofre sem nunca ser usado e o usuário
 * precisa entrar de novo a cada abertura do app — o oposto do que a persistência prometia.
 *
 * Qualquer falha limpa o storage em vez de propagar: no boot não há tela para mostrar erro, e um
 * token inválido só produziria a mesma falha na próxima abertura.
 */
export function createSessionRestorer({
  readRefreshToken,
  refresh,
  currentUser,
  save,
  discard,
}: RestorerOptions): SessionRestorer {
  return async () => {
    try {
      const refreshToken = await readRefreshToken();
      if (!refreshToken) {
        return;
      }

      const tokens = await refresh(refreshToken);
      const profile = await currentUser(tokens.accessToken);

      await save(
        {
          accessToken: tokens.accessToken,
          expiresAt: Date.now() + tokens.expiresIn * 1000,
          profile,
        },
        tokens.refreshToken,
      );
    } catch {
      await discard();
    }
  };
}
