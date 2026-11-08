import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PREFERRED_CURRENCY_HEADER } from '@/lib/currency/header';
import { apiRoutes } from '@/routes';

const getSession = vi.fn();
const getWishlist = vi.fn();
const logApiError = vi.fn();

vi.mock('@/utils/auth/session', () => ({ getSession }));
vi.mock('@/lib/wishlist/getWishlist', () => ({ getWishlist }));
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

describe('GET /api/wishlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    getSession.mockResolvedValue(null);

    const { GET } = await import('./route');
    const response = await GET(request(apiRoutes.wishlist));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
    expect(getWishlist).not.toHaveBeenCalled();
  });

  it('returns the wishlist of the signed-in user with parsed query values', async () => {
    getSession.mockResolvedValue({ id: 5, email: 'a@b.com' });
    getWishlist.mockResolvedValue({ cards: [], count: 0, total: 0, totalPrice: 0 });

    const { GET } = await import('./route');
    const response = await GET(
      request(
        `${apiRoutes.wishlist}?page=2&sort=price&sort_desc=desc&filter_search=bolt&filter_set=3&filter_rarity=R&filter_finish=foil`,
      ),
    );

    expect(response.status).toBe(200);
    expect(getWishlist).toHaveBeenCalledWith({
      userId: 5,
      currencyCode: 'EUR',
      page: 2,
      sort: 'price',
      sortDesc: 'desc',
      filterSearch: 'bolt',
      filterSet: 3,
      filterRarity: 'R',
      filterFinish: 'foil',
    });
  });

  it('ignores invalid query values', async () => {
    getSession.mockResolvedValue({ id: 5, email: 'a@b.com' });
    getWishlist.mockResolvedValue({ cards: [] });

    const { GET } = await import('./route');
    await GET(
      request(
        `${apiRoutes.wishlist}?page=0&sort=nope&sort_desc=up&filter_set=x&filter_finish=shiny`,
      ),
    );

    expect(getWishlist).toHaveBeenCalledWith(
      expect.objectContaining({
        page: undefined,
        sort: undefined,
        sortDesc: undefined,
        filterSet: undefined,
        filterFinish: undefined,
      }),
    );
  });

  it('returns 500 when loading fails', async () => {
    getSession.mockResolvedValue({ id: 5, email: 'a@b.com' });
    getWishlist.mockRejectedValue(new Error('db down'));

    const { GET } = await import('./route');
    const response = await GET(request(apiRoutes.wishlist));

    expect(response.status).toBe(500);
    expect(logApiError).toHaveBeenCalled();
  });
});
