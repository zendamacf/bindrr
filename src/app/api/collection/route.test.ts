import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PREFERRED_CURRENCY_HEADER } from '@/lib/currency/header';
import { apiRoutes, collectionApiUrl } from '@/routes';

const getSession = vi.fn();
const getCollection = vi.fn();
const logApiError = vi.fn();

vi.mock('@/utils/auth/session', () => ({ getSession }));
vi.mock('@/lib/collection/getCollection', () => ({ getCollection }));
vi.mock('@/lib/api/errors', () => ({
  apiInternalErrorResponse: (message: string, error: unknown, context: unknown) => {
    logApiError(error, context);
    return Response.json({ error: message }, { status: 500 });
  },
}));

function request(url: string, currency = 'EUR') {
  return new Request(`http://localhost${url}`, {
    headers: { [PREFERRED_CURRENCY_HEADER]: currency },
  });
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
      currencyCode: 'EUR',
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
      currencyCode: 'EUR',
      page: undefined,
      sort: undefined,
      sortDesc: undefined,
      filterSearch: undefined,
      filterSet: 3,
      filterRarity: 'R',
    });
  });

  it('defaults to USD when the currency header is missing', async () => {
    getSession.mockResolvedValue({ id: 1, email: 'a@b.com' });
    getCollection.mockResolvedValue({
      cards: [],
      count: 0,
      total: 0,
      totalPrice: 0,
      currencyCode: 'USD',
    });

    const { GET } = await import('./route');
    await GET(new Request(`http://localhost${apiRoutes.collection}`));

    expect(getCollection).toHaveBeenCalledWith(expect.objectContaining({ currencyCode: 'USD' }));
  });

  it('returns 500 when collection loading fails', async () => {
    getSession.mockResolvedValue({ id: 1, email: 'a@b.com' });
    getCollection.mockRejectedValue(new Error('db down'));

    const { GET } = await import('./route');
    const response = await GET(request(apiRoutes.collection));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Failed to load collection' });
    expect(logApiError).toHaveBeenCalledWith(new Error('db down'), {
      route: '/api/collection',
      method: 'GET',
      userId: 1,
    });
  });
});
