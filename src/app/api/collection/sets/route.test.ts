import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSession = vi.fn();
const getCardSets = vi.fn();

vi.mock('@/utils/auth/session', () => ({ getSession }));
vi.mock('@/lib/cache/cardSets', () => ({ getCardSets }));

describe('GET /api/collection/sets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    getSession.mockResolvedValue(null);

    const { GET } = await import('./route');
    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns card sets for the signed-in user', async () => {
    getSession.mockResolvedValue({ id: 2, email: 'a@b.com' });
    getCardSets.mockResolvedValue([{ id: 1, name: 'Alpha', code: 'LEA' }]);

    const { GET } = await import('./route');
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sets: [{ id: 1, name: 'Alpha', code: 'LEA' }],
    });
  });
});
