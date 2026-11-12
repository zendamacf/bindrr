import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRoutes } from '@/routes';

const getSession = vi.fn();
const addAnyPrintingToWishlist = vi.fn();
const getWishlistAny = vi.fn();
const logApiError = vi.fn();

vi.mock('@/utils/auth/session', () => ({ getSession }));
vi.mock('@/lib/wishlist/addAnyPrintingToWishlist', () => ({ addAnyPrintingToWishlist }));
vi.mock('@/lib/wishlist/getWishlistAny', () => ({ getWishlistAny }));
vi.mock('@/lib/api/errors', () => ({
  apiInternalErrorResponse: (message: string, error: unknown, context: unknown) => {
    logApiError(error, context);
    return Response.json({ error: message }, { status: 500 });
  },
}));

function post(body: unknown) {
  return new Request(`http://localhost${apiRoutes.wishlistAny}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('/api/wishlist/any', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ id: 7, email: 'a@b.com' });
  });

  it('returns 401 when not authenticated', async () => {
    getSession.mockResolvedValue(null);
    const { GET, POST } = await import('./route');

    expect((await GET(new Request(`http://localhost${apiRoutes.wishlistAny}`))).status).toBe(401);
    expect((await POST(post({ scryfallId: 'abc' }))).status).toBe(401);
  });

  it('GET returns the entries for the user', async () => {
    getWishlistAny.mockResolvedValue({ cards: [], totalPrice: 0, currencyCode: 'USD' });
    const { GET } = await import('./route');
    const response = await GET(new Request(`http://localhost${apiRoutes.wishlistAny}`));

    expect(response.status).toBe(200);
    expect(getWishlistAny).toHaveBeenCalledWith(expect.objectContaining({ userId: 7 }));
  });

  it('GET returns 500 on failure', async () => {
    getWishlistAny.mockRejectedValue(new Error('db'));
    const { GET } = await import('./route');
    const response = await GET(new Request(`http://localhost${apiRoutes.wishlistAny}`));

    expect(response.status).toBe(500);
  });

  it.each([
    ['{bad', 'Invalid JSON'],
    [{ quantity: 1 }, 'Missing scryfallId'],
    [{ scryfallId: 's', quantity: 0 }, 'Invalid quantity'],
    [{ scryfallId: 's', finish: 'shiny' }, 'Invalid finish'],
  ])('POST returns 400 for %j', async (body, error) => {
    const { POST } = await import('./route');
    const response = await POST(post(body));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error });
  });

  it('POST uses defaults and passes values through', async () => {
    addAnyPrintingToWishlist.mockResolvedValue({ ok: true });
    const { POST } = await import('./route');

    await POST(post({ scryfallId: ' sid ' }));
    expect(addAnyPrintingToWishlist).toHaveBeenLastCalledWith({
      userId: 7,
      scryfallId: 'sid',
      quantity: 1,
      finish: 'any',
    });

    await POST(post({ scryfallId: 'sid', quantity: 2, finish: 'foil' }));
    expect(addAnyPrintingToWishlist).toHaveBeenLastCalledWith({
      userId: 7,
      scryfallId: 'sid',
      quantity: 2,
      finish: 'foil',
    });
  });

  it('POST returns 500 on failure', async () => {
    addAnyPrintingToWishlist.mockRejectedValue(new Error('db'));
    const { POST } = await import('./route');

    expect((await POST(post({ scryfallId: 'sid' }))).status).toBe(500);
    expect(logApiError).toHaveBeenCalled();
  });
});
