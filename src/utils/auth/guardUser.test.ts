import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from './types';

const user: AuthUser = { id: 1, email: 'guard@example.com' };

vi.mock('./session', () => ({
  getSession: vi.fn(),
}));

describe('guardUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the session user when authenticated', async () => {
    const { getSession } = await import('./session');
    vi.mocked(getSession).mockResolvedValue(user);

    const { guardUser } = await import('./guardUser');
    await expect(guardUser()).resolves.toEqual(user);
  });

  it('returns null when there is no session', async () => {
    const { getSession } = await import('./session');
    vi.mocked(getSession).mockResolvedValue(null);

    const { guardUser } = await import('./guardUser');
    await expect(guardUser()).resolves.toBeNull();
  });
});
