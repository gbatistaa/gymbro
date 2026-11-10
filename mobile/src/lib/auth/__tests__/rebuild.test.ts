import { createSessionRestorer } from '../bootstrap';
import { clearSession, getSession, setSession } from '../session';
import { createTokenStorage, type SecureStoreLike } from '../storage';

/**
 * Prova o caminho do rebuild com as peças reais ligadas:
 * cofre (driver fake só na parte nativa) → refresh → perfil → átomo de sessão.
 *
 * O driver é fake porque o SecureStore nativo não existe no Jest; todo o resto é o código que
 * roda no boot (`getSessionRestorer` monta exatamente estas ligações em `src/lib/api/index.ts`).
 */
function fakeDriver(preloaded: string | null): SecureStoreLike & { saved: (string | null)[] } {
  let value = preloaded;
  const saved: (string | null)[] = [];
  return {
    saved,
    getItemAsync: async () => value,
    setItemAsync: async (_key: string, next: string) => {
      value = next;
      saved.push(next);
    },
    deleteItemAsync: async () => {
      value = null;
    },
  };
}

const PROFILE = {
  id: 'user-1',
  name: 'Ana',
  email: 'ana@example.com',
  timezone: 'America/Sao_Paulo',
  createdAt: '2026-01-01T00:00:00Z',
};

describe('rebuild from the stored refresh token', () => {
  beforeEach(async () => {
    await clearSession().catch(() => {});
    setSession(null as never);
  });

  it('turns the stored refresh token into a live session without asking for the password', async () => {
    const driver = fakeDriver('refresh-from-previous-install');
    const storage = createTokenStorage(driver);

    const restore = createSessionRestorer({
      readRefreshToken: () => storage.read(),
      refresh: async () => ({ accessToken: 'access-new', refreshToken: 'refresh-rotated', expiresIn: 900 }),
      currentUser: async () => PROFILE,
      save: async (session, refreshToken) => {
        await storage.save(refreshToken);
        setSession(session);
      },
      discard: () => storage.clear(),
    });

    expect(getSession()).toBeNull();

    await restore();

    const session = getSession();
    expect(session?.accessToken).toBe('access-new');
    expect(session?.profile.email).toBe('ana@example.com');
    // o backend rotaciona o refresh: o cofre guarda o novo, não o que veio do install anterior
    expect(driver.saved).toEqual(['refresh-rotated']);
  });

  it('stays logged out when the cofre is empty, without calling the API', async () => {
    const storage = createTokenStorage(fakeDriver(null));
    const refresh = jest.fn();

    const restore = createSessionRestorer({
      readRefreshToken: () => storage.read(),
      refresh,
      currentUser: async () => PROFILE,
      save: async () => {},
      discard: () => storage.clear(),
    });

    await restore();

    expect(refresh).not.toHaveBeenCalled();
    expect(getSession()).toBeNull();
  });
});
