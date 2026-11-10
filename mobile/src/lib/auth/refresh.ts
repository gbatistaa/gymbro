export type RefreshResult = {
  accessToken: string;
  refreshToken: string;
  /** Segundos até expirar, para recalcular `expiresAt` da sessão. */
  expiresIn: number;
};

/** Devolve um access token novo, ou `null` quando a sessão não pode mais ser renovada. */
export type AccessTokenRefresher = () => Promise<string | null>;

type RefresherOptions = {
  /** Lê o refresh token do cofre (ou da memória, na web). */
  getRefreshToken: () => Promise<string | null>;
  /** Chama `POST /api/auth/refresh`. Rejeita quando o backend recusa. */
  requestRefresh: (refreshToken: string) => Promise<RefreshResult>;
  onRefreshed: (result: RefreshResult) => Promise<void>;
  /** Sessão irrecuperável: limpar storage e voltar ao login. */
  onRefused: () => Promise<void>;
};

/**
 * Renovador de access token com **um único refresh em voo**.
 *
 * Sem a coalescência, cinco requisições paralelas que recebem 401 disparam cinco refreshes. Como o
 * backend pode rotacionar o refresh token, o segundo já usaria um token que o primeiro acabou de
 * consumir — o usuário seria deslogado por concorrência, e não por expiração.
 *
 * Nunca rejeita: quando a renovação falha, devolve `null` depois de `onRefused`. Quem chamou decide
 * o que mostrar, sem precisar de try/catch.
 */
export function createAccessTokenRefresher({
  getRefreshToken,
  requestRefresh,
  onRefreshed,
  onRefused,
}: RefresherOptions): AccessTokenRefresher {
  let inFlight: Promise<string | null> | null = null;

  async function run(): Promise<string | null> {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      await onRefused();
      return null;
    }

    try {
      const result = await requestRefresh(refreshToken);
      await onRefreshed(result);
      return result.accessToken;
    } catch {
      await onRefused();
      return null;
    }
  }

  return () => {
    inFlight ??= run().finally(() => {
      inFlight = null;
    });
    return inFlight;
  };
}
