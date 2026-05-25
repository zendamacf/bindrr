import { beforeEach, describe, expect, it, vi } from 'vitest';

const redirect = vi.fn();
const revalidatePath = vi.fn();
const verifyPassword = vi.fn();
const createSession = vi.fn();
const destroySession = vi.fn();

const dbSelect = vi.fn();

vi.mock('next/navigation', () => ({ redirect }));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/utils/auth/password', () => ({ verifyPassword }));
vi.mock('@/utils/auth/session', () => ({ createSession, destroySession }));
vi.mock('@/lib/db/schema', () => ({ users: 'users' }));
vi.mock('@/lib/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: dbSelect,
        }),
      }),
    }),
  },
}));

function formData(entries: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }
  return data;
}

describe('auth actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redirect.mockImplementation(() => {
      throw new Error('REDIRECT');
    });
  });

  describe('login', () => {
    it('creates a session and redirects on success', async () => {
      dbSelect.mockResolvedValue([{ id: 3, email: 'User@Example.com', passwordHash: 'hash' }]);
      verifyPassword.mockResolvedValue(true);

      const { login } = await import('./actions');
      await expect(
        login(formData({ email: 'User@Example.com', password: 'secret' })),
      ).rejects.toThrow('REDIRECT');

      expect(verifyPassword).toHaveBeenCalledWith('secret', 'hash');
      expect(createSession).toHaveBeenCalledWith({ id: 3, email: 'User@Example.com' });
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
      expect(redirect).toHaveBeenCalledWith('/');
    });

    it('normalizes email to lowercase', async () => {
      dbSelect.mockResolvedValue([]);
      verifyPassword.mockResolvedValue(false);

      const { login } = await import('./actions');
      await expect(
        login(formData({ email: '  USER@EXAMPLE.COM  ', password: 'x' })),
      ).rejects.toThrow('Invalid email or password');

      expect(dbSelect).toHaveBeenCalled();
    });

    it('throws when email or password is missing', async () => {
      const { login } = await import('./actions');
      await expect(login(formData({ email: '', password: '' }))).rejects.toThrow(
        'Please provide both your email & password',
      );
    });

    it('throws for invalid credentials', async () => {
      dbSelect.mockResolvedValue([]);

      const { login } = await import('./actions');
      await expect(login(formData({ email: 'a@b.com', password: 'wrong' }))).rejects.toThrow(
        'Invalid email or password',
      );
    });

    it('throws when password does not match', async () => {
      dbSelect.mockResolvedValue([{ id: 1, email: 'a@b.com', passwordHash: 'hash' }]);
      verifyPassword.mockResolvedValue(false);

      const { login } = await import('./actions');
      await expect(login(formData({ email: 'a@b.com', password: 'wrong' }))).rejects.toThrow(
        'Invalid email or password',
      );
    });
  });

  describe('logout', () => {
    it('destroys the session and redirects to login', async () => {
      const { logout } = await import('./actions');
      await expect(logout()).rejects.toThrow('REDIRECT');

      expect(destroySession).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith('/login');
    });
  });
});
