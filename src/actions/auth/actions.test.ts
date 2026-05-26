import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '@/routes';
import {
  cleanupFixture,
  createFixtureTracker,
  type DbFixtureIds,
  insertTestUser,
} from '@/test/db-fixture';

const redirect = vi.fn();
const revalidatePath = vi.fn();
const createSession = vi.fn();
const destroySession = vi.fn();

vi.mock('next/navigation', () => ({ redirect }));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/utils/auth/session', () => ({ createSession, destroySession }));

function formData(entries: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }
  return data;
}

describe('auth actions', () => {
  let ids: DbFixtureIds;

  beforeEach(() => {
    ids = createFixtureTracker();
    vi.clearAllMocks();
    redirect.mockImplementation(() => {
      throw new Error('REDIRECT');
    });
  });

  afterEach(async () => {
    await cleanupFixture(ids);
  });

  describe('login', () => {
    it('creates a session and redirects on success', async () => {
      const user = await insertTestUser(ids, { password: 'secret' });

      const { login } = await import('./actions');
      await expect(login(formData({ email: user.email, password: 'secret' }))).rejects.toThrow(
        'REDIRECT',
      );

      expect(createSession).toHaveBeenCalledWith({ id: user.id, email: user.email });
      expect(revalidatePath).toHaveBeenCalledWith(routes.home, 'layout');
      expect(redirect).toHaveBeenCalledWith(routes.home);
    });

    it('normalizes email to lowercase', async () => {
      const user = await insertTestUser(ids, { password: 'secret' });

      const { login } = await import('./actions');
      await expect(
        login(formData({ email: `  ${user.email.toUpperCase()}  `, password: 'wrong' })),
      ).rejects.toThrow('Invalid email or password');
    });

    it('throws when email or password is missing', async () => {
      const { login } = await import('./actions');
      await expect(login(formData({ email: '', password: '' }))).rejects.toThrow(
        'Please provide both your email & password.',
      );
    });

    it('throws for invalid credentials when user does not exist', async () => {
      const { login } = await import('./actions');
      await expect(login(formData({ email: 'a@b.com', password: 'wrong' }))).rejects.toThrow(
        'Invalid email or password',
      );
    });

    it('throws when password does not match', async () => {
      const user = await insertTestUser(ids, { password: 'correct' });

      const { login } = await import('./actions');
      await expect(login(formData({ email: user.email, password: 'wrong' }))).rejects.toThrow(
        'Invalid email or password',
      );
    });
  });

  describe('logout', () => {
    it('destroys the session and redirects to login', async () => {
      const { logout } = await import('./actions');
      await expect(logout()).rejects.toThrow('REDIRECT');

      expect(destroySession).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith(routes.login);
    });
  });
});
