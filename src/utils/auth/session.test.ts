import { beforeEach, describe, expect, it, vi } from 'vitest';
import { encodeSecret, signSessionToken } from './session-token';
import type { AuthUser } from './types';

const user: AuthUser = { id: 7, email: 'test@example.com' };
const secret = encodeSecret('test-auth-secret-at-least-32-chars-long');

const cookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => cookieStore),
}));

describe('session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('AUTH_SECRET', 'test-auth-secret-at-least-32-chars-long');
    vi.stubEnv('NODE_ENV', 'test');
  });

  it('createSession sets an httpOnly session cookie', async () => {
    const { createSession } = await import('./session');
    await createSession(user);

    expect(cookieStore.set).toHaveBeenCalledWith(
      'session',
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
        secure: false,
      }),
    );
  });

  it('getSession returns the user from a valid cookie', async () => {
    const token = await signSessionToken(user, secret);
    cookieStore.get.mockReturnValue({ value: token });

    const { getSession } = await import('./session');
    await expect(getSession()).resolves.toEqual(user);
  });

  it('getSession returns null when no cookie is present', async () => {
    cookieStore.get.mockReturnValue(undefined);

    const { getSession } = await import('./session');
    await expect(getSession()).resolves.toBeNull();
  });

  it('destroySession deletes the session cookie', async () => {
    const { destroySession } = await import('./session');
    await destroySession();

    expect(cookieStore.delete).toHaveBeenCalledWith('session');
  });

  it('throws when AUTH_SECRET is not set', async () => {
    vi.stubEnv('AUTH_SECRET', '');
    vi.resetModules();

    const { createSession } = await import('./session');
    await expect(createSession(user)).rejects.toThrow('AUTH_SECRET is not set');
  });
});
