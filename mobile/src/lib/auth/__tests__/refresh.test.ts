import { createAccessTokenRefresher, type RefreshResult } from '../refresh';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const RESULT: RefreshResult = { accessToken: 'access-2', refreshToken: 'refresh-2', expiresIn: 900 };

function refresherWith(overrides: {
  refreshToken?: string | null;
  requestRefresh?: (token: string) => Promise<RefreshResult>;
}) {
  const requestRefresh = jest.fn(overrides.requestRefresh ?? (async () => RESULT));
  const onRefreshed = jest.fn(async () => {});
  const onRefused = jest.fn(async () => {});
  const refresher = createAccessTokenRefresher({
    // `??` engoliria o null do caso "sem token", então a checagem é por undefined
    getRefreshToken: async () =>
      overrides.refreshToken === undefined ? 'refresh-1' : overrides.refreshToken,
    requestRefresh,
    onRefreshed,
    onRefused,
  });
  return { refresher, requestRefresh, onRefreshed, onRefused };
}

describe('createAccessTokenRefresher', () => {
  it('coalesces concurrent calls into a single refresh request', async () => {
    const gate = deferred<RefreshResult>();
    const { refresher, requestRefresh } = refresherWith({
      requestRefresh: () => gate.promise,
    });

    const first = refresher();
    const second = refresher();
    const third = refresher();
    gate.resolve(RESULT);

    await expect(first).resolves.toBe('access-2');
    await expect(second).resolves.toBe('access-2');
    await expect(third).resolves.toBe('access-2');
    expect(requestRefresh).toHaveBeenCalledTimes(1);
  });

  it('refreshes again once the previous attempt settled', async () => {
    const { refresher, requestRefresh } = refresherWith({});

    await refresher();
    await refresher();

    expect(requestRefresh).toHaveBeenCalledTimes(2);
  });

  it('publishes the new tokens when the refresh succeeds', async () => {
    const { refresher, onRefreshed, onRefused } = refresherWith({});

    await refresher();

    expect(onRefreshed).toHaveBeenCalledWith(RESULT);
    expect(onRefused).not.toHaveBeenCalled();
  });

  it('refuses without calling the API when there is no stored refresh token', async () => {
    const { refresher, requestRefresh, onRefused } = refresherWith({ refreshToken: null });

    await expect(refresher()).resolves.toBeNull();

    expect(requestRefresh).not.toHaveBeenCalled();
    expect(onRefused).toHaveBeenCalledTimes(1);
  });

  it('resolves null instead of throwing when the backend refuses the refresh', async () => {
    const { refresher, onRefused } = refresherWith({
      requestRefresh: async () => {
        throw new Error('401');
      },
    });

    await expect(refresher()).resolves.toBeNull();
    expect(onRefused).toHaveBeenCalledTimes(1);
  });
});
