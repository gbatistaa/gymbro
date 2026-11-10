import { createTokenStorage, type SecureStoreLike } from '../storage';

function fakeStore(): SecureStoreLike & { entries: Map<string, string>; deleted: string[] } {
  const entries = new Map<string, string>();
  const deleted: string[] = [];
  return {
    entries,
    deleted,
    getItemAsync: async (key) => entries.get(key) ?? null,
    setItemAsync: async (key, value) => {
      entries.set(key, value);
    },
    deleteItemAsync: async (key) => {
      deleted.push(key);
      entries.delete(key);
    },
  };
}

describe('createTokenStorage', () => {
  it('round-trips the refresh token through the driver', async () => {
    const driver = fakeStore();
    const storage = createTokenStorage(driver);

    await storage.save('token-123');

    expect(storage.canPersist).toBe(true);
    await expect(storage.read()).resolves.toBe('token-123');
  });

  it('clears the stored token', async () => {
    const driver = fakeStore();
    const storage = createTokenStorage(driver);
    await storage.save('token-123');

    await storage.clear();

    await expect(storage.read()).resolves.toBeNull();
    expect(driver.deleted).toHaveLength(1);
  });

  it('returns null when nothing was stored', async () => {
    const storage = createTokenStorage(fakeStore());

    await expect(storage.read()).resolves.toBeNull();
  });

  it('degrades to a no-op without a driver instead of throwing', async () => {
    const storage = createTokenStorage(null);

    expect(storage.canPersist).toBe(false);
    await expect(storage.save('token-123')).resolves.toBeUndefined();
    await expect(storage.read()).resolves.toBeNull();
    await expect(storage.clear()).resolves.toBeUndefined();
  });
});
