import type { AuthTokens } from '@/lib/api/auth';

import { createSessionRestorer } from '../bootstrap';
import type { Profile } from '../session';

const PROFILE: Profile = {
  id: 'user-1',
  name: 'Ana',
  email: 'ana@example.com',
  timezone: 'America/Sao_Paulo',
  createdAt: '2026-01-01T00:00:00Z',
};

const TOKENS: AuthTokens = { accessToken: 'access-new', refreshToken: 'refresh-new', expiresIn: 900 };

function restorerWith(overrides: { refreshToken?: string | null; refreshFails?: boolean }) {
  const save = jest.fn(async () => {});
  const discard = jest.fn(async () => {});
  const refresh = jest.fn(async () =>
    overrides.refreshFails
      ? Promise.reject(new Error('401'))
      : Promise.resolve(TOKENS),
  );
  const currentUser = jest.fn(async () => PROFILE);

  const restore = createSessionRestorer({
    readRefreshToken: async () =>
      overrides.refreshToken === undefined ? 'refresh-1' : overrides.refreshToken,
    refresh,
    currentUser,
    save,
    discard,
  });

  return { restore, save, discard, refresh, currentUser };
}

describe('createSessionRestorer', () => {
  it('rebuilds the session from the stored refresh token', async () => {
    const { restore, save } = restorerWith({});

    await restore();

    expect(save).toHaveBeenCalledTimes(1);
    const [session, refreshToken] = save.mock.calls[0] as unknown as [Record<string, unknown>, string];
    expect(session.accessToken).toBe('access-new');
    expect(session.profile).toEqual(PROFILE);
    expect(session.expiresAt as number).toBeGreaterThan(Date.now());
    expect(refreshToken).toBe('refresh-new');
  });

  it('does nothing when there is no stored token', async () => {
    const { restore, refresh, save, discard } = restorerWith({ refreshToken: null });

    await restore();

    expect(refresh).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
    expect(discard).not.toHaveBeenCalled();
  });

  it('discards the stored token when the refresh is refused', async () => {
    const { restore, save, discard } = restorerWith({ refreshFails: true });

    await restore();

    expect(save).not.toHaveBeenCalled();
    expect(discard).toHaveBeenCalledTimes(1);
  });
});
