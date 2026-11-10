import { createAuthApi } from '../auth';
import type { ApiClient, ApiRequestOptions } from '../client';

function stubClient(result: unknown) {
  const calls: { path: string; options?: ApiRequestOptions }[] = [];
  const client: ApiClient = {
    async request<T>(path: string, options?: ApiRequestOptions) {
      calls.push({ path, options });
      // stub de teste: o retorno é o que o caso montou, sem generics reais
      return result as T;
    },
  };
  return { client, calls };
}

const TOKENS = { accessToken: 'access-1', refreshToken: 'refresh-1', tokenType: 'Bearer', expiresIn: 900 };

describe('createAuthApi', () => {
  it('posts credentials to the login endpoint and normalizes the tokens', async () => {
    const { client, calls } = stubClient(TOKENS);
    const api = createAuthApi(client);

    await expect(api.login({ email: 'a@b.c', password: 'secret123' })).resolves.toEqual({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      expiresIn: 900,
    });
    expect(calls[0].path).toBe('/api/auth/login');
    expect(calls[0].options).toMatchObject({ method: 'POST', body: { email: 'a@b.c' } });
  });

  it('rejects a login response without tokens instead of sending Bearer undefined', async () => {
    const { client } = stubClient({ tokenType: 'Bearer' });
    const api = createAuthApi(client);

    await expect(api.login({ email: 'a@b.c', password: 'x' })).rejects.toMatchObject({
      code: 'UNEXPECTED_RESPONSE',
    });
  });

  it('posts the registration to the register endpoint', async () => {
    const { client, calls } = stubClient({ id: '1' });
    const api = createAuthApi(client);

    await api.register({ name: 'Ana', email: 'a@b.c', password: 'secret123' });

    expect(calls[0].path).toBe('/api/auth/register');
    expect(calls[0].options?.method).toBe('POST');
  });

  it('passes an explicit token when fetching the profile right after login', async () => {
    const { client, calls } = stubClient({ id: '1' });
    const api = createAuthApi(client);

    await api.currentUser('fresh-token');

    expect(calls[0].path).toBe('/api/users/me');
    expect(calls[0].options?.token).toBe('fresh-token');
  });

  it('sends the refresh token in the body', async () => {
    const { client, calls } = stubClient(TOKENS);
    const api = createAuthApi(client);

    await api.refresh('refresh-1');

    expect(calls[0].path).toBe('/api/auth/refresh');
    expect(calls[0].options?.body).toEqual({ refreshToken: 'refresh-1' });
  });
});
