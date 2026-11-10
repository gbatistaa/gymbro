import {
  createApiClient,
  resolveBaseUrl,
  type FetchLike,
  type FetchResponse,
} from '../client';
import { ApiError } from '../error';

const BASE = 'https://api.test';

function reply(status: number, body?: unknown): FetchResponse {
  return {
    status,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  };
}

function recordingFetch(response: FetchResponse): { fetchImpl: FetchLike; calls: RequestInit[] } {
  const calls: RequestInit[] = [];
  const fetchImpl: FetchLike = async (_url, init) => {
    calls.push(init);
    return response;
  };
  return { fetchImpl, calls };
}

describe('createApiClient', () => {
  it('sends the bearer token and parses the JSON body', async () => {
    const { fetchImpl, calls } = recordingFetch(reply(200, { id: '1' }));
    const client = createApiClient({ baseUrl: BASE, getAccessToken: () => 'abc', fetchImpl });

    await expect(client.request('/api/users/me')).resolves.toEqual({ id: '1' });

    const headers = calls[0].headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer abc');
  });

  it('omits the Authorization header when there is no token', async () => {
    const { fetchImpl, calls } = recordingFetch(reply(200, {}));
    const client = createApiClient({ baseUrl: BASE, fetchImpl });

    await client.request('/api/health');

    const headers = calls[0].headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('serializes the body and sets the content type on POST', async () => {
    const { fetchImpl, calls } = recordingFetch(reply(201, { id: '1' }));
    const client = createApiClient({ baseUrl: BASE, fetchImpl });

    await client.request('/api/exercises', { method: 'POST', body: { name: 'Supino' } });

    const headers = calls[0].headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(calls[0].body).toBe('{"name":"Supino"}');
  });

  it('rejects with an ApiError carrying the domain code and field errors', async () => {
    const { fetchImpl } = recordingFetch(
      reply(409, {
        status: 409,
        code: 'SESSION_ALREADY_ACTIVE',
        message: 'An open session already exists',
        errors: [{ field: 'playlistId', message: 'já aberto' }],
      }),
    );
    const client = createApiClient({ baseUrl: BASE, fetchImpl });

    await expect(client.request('/api/sessions', { method: 'POST' })).rejects.toMatchObject({
      code: 'SESSION_ALREADY_ACTIVE',
      status: 409,
      fields: [{ field: 'playlistId', message: 'já aberto' }],
    });
  });

  it('turns a non-JSON error body into INTERNAL_ERROR instead of throwing a parse error', async () => {
    const htmlBody: FetchResponse = { status: 502, text: async () => '<html>Bad Gateway</html>' };
    const client = createApiClient({ baseUrl: BASE, fetchImpl: async () => htmlBody });

    await expect(client.request('/api/exercises')).rejects.toMatchObject({
      code: 'INTERNAL_ERROR',
      status: 502,
    });
  });

  it('resolves undefined for 204 without trying to parse a body', async () => {
    const client = createApiClient({ baseUrl: BASE, fetchImpl: async () => reply(204) });

    await expect(client.request('/api/users/me', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('wraps a transport failure as NETWORK', async () => {
    const client = createApiClient({
      baseUrl: BASE,
      fetchImpl: async () => {
        throw new TypeError('Network request failed');
      },
    });

    await expect(client.request('/api/health')).rejects.toBeInstanceOf(ApiError);
    await expect(client.request('/api/health')).rejects.toMatchObject({ code: 'NETWORK' });
  });

  it('aborts a request that exceeds the timeout', async () => {
    const hanging: FetchLike = (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      });
    const client = createApiClient({ baseUrl: BASE, fetchImpl: hanging, timeoutMs: 10 });

    await expect(client.request('/api/health')).rejects.toMatchObject({ code: 'NETWORK' });
  });

  it('joins base url and path without a double slash', async () => {
    const seen: string[] = [];
    const client = createApiClient({
      baseUrl: `${BASE}/`,
      fetchImpl: async (url) => {
        seen.push(url);
        return reply(200, {});
      },
    });

    await client.request('/api/health');

    expect(seen[0]).toBe('https://api.test/api/health');
  });
});

describe('resolveBaseUrl', () => {
  const original = process.env.EXPO_PUBLIC_API_URL;

  afterEach(() => {
    process.env.EXPO_PUBLIC_API_URL = original;
  });

  it('uses EXPO_PUBLIC_API_URL and strips the trailing slash', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.gymbro.test/';

    expect(resolveBaseUrl()).toBe('https://api.gymbro.test');
  });

  it('fails loudly when the variable is missing', () => {
    delete process.env.EXPO_PUBLIC_API_URL;

    expect(() => resolveBaseUrl()).toThrow(/EXPO_PUBLIC_API_URL/);
  });
});

describe('createApiClient — refresh on 401', () => {
  function sequenceFetch(responses: FetchResponse[]) {
    let index = 0;
    const calls: RequestInit[] = [];
    const fetchImpl: FetchLike = async (_url, init) => {
      calls.push(init);
      const response = responses[Math.min(index, responses.length - 1)];
      index += 1;
      return response;
    };
    return { fetchImpl, calls, sentRequests: () => index };
  }

  const unauthorized = reply(401, { status: 401, code: 'UNAUTHENTICATED' });

  it('retries once with the refreshed token', async () => {
    const { fetchImpl, calls } = sequenceFetch([unauthorized, reply(200, { ok: true })]);
    const refreshAccessToken = jest.fn(async () => 'refreshed-token');
    const client = createApiClient({
      baseUrl: BASE,
      getAccessToken: () => 'stale-token',
      refreshAccessToken,
      fetchImpl,
    });

    await expect(client.request('/api/users/me')).resolves.toEqual({ ok: true });

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect((calls[0].headers as Record<string, string>).Authorization).toBe('Bearer stale-token');
    expect((calls[1].headers as Record<string, string>).Authorization).toBe('Bearer refreshed-token');
  });

  it('gives up when the refresh returns null, without a second request', async () => {
    const { fetchImpl, sentRequests } = sequenceFetch([unauthorized]);
    const client = createApiClient({
      baseUrl: BASE,
      refreshAccessToken: async () => null,
      fetchImpl,
    });

    await expect(client.request('/api/users/me')).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
      status: 401,
    });
    expect(sentRequests()).toBe(1);
  });

  it('does not loop when the retry is also unauthorized', async () => {
    const { fetchImpl, sentRequests } = sequenceFetch([unauthorized, unauthorized]);
    const refreshAccessToken = jest.fn(async () => 'refreshed-token');
    const client = createApiClient({
      baseUrl: BASE,
      getAccessToken: () => 'stale-token',
      refreshAccessToken,
      fetchImpl,
    });

    await expect(client.request('/api/users/me')).rejects.toMatchObject({ status: 401 });

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(sentRequests()).toBe(2);
  });

  it('never refreshes on an error that is not 401', async () => {
    const { fetchImpl } = sequenceFetch([reply(409, { status: 409, code: 'CONFLICT' })]);
    const refreshAccessToken = jest.fn(async () => 'refreshed-token');
    const client = createApiClient({
      baseUrl: BASE,
      getAccessToken: () => 'stale-token',
      refreshAccessToken,
      fetchImpl,
    });

    await expect(client.request('/api/sessions', { method: 'POST' })).rejects.toMatchObject({
      code: 'CONFLICT',
    });

    expect(refreshAccessToken).not.toHaveBeenCalled();
  });
});

describe('createApiClient — explicit token', () => {
  it('uses the token passed per request instead of the session token', async () => {
    const { fetchImpl, calls } = recordingFetch(reply(200, { id: '1' }));
    const client = createApiClient({ baseUrl: BASE, getAccessToken: () => 'session-token', fetchImpl });

    await client.request('/api/users/me', { token: 'fresh-token' });

    expect((calls[0].headers as Record<string, string>).Authorization).toBe('Bearer fresh-token');
  });
});

describe('createApiClient — endpoints de autenticação', () => {
  it('never refreshes when the request opts out', async () => {
    const { fetchImpl } = recordingFetch(reply(401, { status: 401, code: 'UNAUTHENTICATED' }));
    const refreshAccessToken = jest.fn(async () => 'refreshed-token');
    const client = createApiClient({
      baseUrl: BASE,
      getAccessToken: () => 'stale-token',
      refreshAccessToken,
      fetchImpl,
    });

    await expect(
      client.request('/api/auth/login', { method: 'POST', skipAuthRefresh: true }),
    ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });

    expect(refreshAccessToken).not.toHaveBeenCalled();
  });
});

describe('createApiClient — falha de transporte', () => {
  it('carries the origin of the unreachable API in the error message', async () => {
    const client = createApiClient({
      baseUrl: BASE,
      fetchImpl: async () => {
        throw new TypeError('Network request failed');
      },
    });

    await expect(client.request('/api/health')).rejects.toMatchObject({
      code: 'NETWORK',
      message: 'https://api.test',
    });
  });
});
