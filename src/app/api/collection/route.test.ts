import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRoutes, collectionApiUrl } from '@/routes';

const getSession = vi.fn();
const getCollection = vi.fn();

vi.mock('@/utils/auth/session', () => ({ getSession }));
vi.mock('@/lib/collection/getCollection', () => ({ getCollection }));

function request(url: string) {
  return new Request(`http://localhost${url}`);
}

describe('GET /api/collection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    getSession.mockResolvedValue(null);

    const { GET } = await import('./route');
    const response = await GET(request(apiRoutes.collection));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns collection data for the signed-in user', async () => {
    getSession.mockResolvedValue({ id: 5, email: 'a@b.com' });
    getCollection.mockResolvedValue({
      cards: [],
      count: 0,
      total: 0,
      totalPrice: 0,
    });

    const { GET } = await import('./route');
    const response = await GET(
      request(
        collectionApiUrl(
          new URLSearchParams({
            page: '2',
            sort: 'quantity',
            sort_desc: 'desc',
            filter_search: 'bolt',
          }),
        ),
      ),
    );

    expect(response.status).toBe(200);
    expect(getCollection).toHaveBeenCalledWith({
      userId: 5,
      page: 2,
      sort: 'quantity',
      sortDesc: 'desc',
      filterSearch: 'bolt',
      filterSet: undefined,
      filterRarity: undefined,
    });
    await expect(response.json()).resolves.toEqual({
      cards: [],
      count: 0,
      total: 0,
      totalPrice: 0,
    });
  });

  it('parses set and rarity filters', async () => {
    getSession.mockResolvedValue({ id: 1, email: 'a@b.com' });
    getCollection.mockResolvedValue({
      cards: [],
      count: 0,
      total: 0,
      totalPrice: 0,
    });

    const { GET } = await import('./route');
    await GET(
      request(
        collectionApiUrl(
          new URLSearchParams({
            filter_set: '3',
            filter_rarity: 'R',
            sort: 'invalid',
          }),
        ),
      ),
    );

    expect(getCollection).toHaveBeenCalledWith({
      userId: 1,
      page: undefined,
      sort: undefined,
      sortDesc: undefined,
      filterSearch: undefined,
      filterSet: 3,
      filterRarity: 'R',
    });
  });

  it('returns 500 when collection loading fails', async () => {
    getSession.mockResolvedValue({ id: 1, email: 'a@b.com' });
    getCollection.mockRejectedValue(new Error('db down'));

    const { GET } = await import('./route');
    const response = await GET(request(apiRoutes.collection));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Failed to load collection' });
  });
});
