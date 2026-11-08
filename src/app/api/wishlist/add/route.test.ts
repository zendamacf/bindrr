import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRoutes } from '@/routes';

const getSession = vi.fn();
const addToWishlist = vi.fn();
const logApiError = vi.fn();

vi.mock('@/utils/auth/session', () => ({ getSession }));
vi.mock('@/lib/wishlist/addToWishlist', () => ({ addToWishlist }));
vi.mock('@/lib/api/errors', () => ({
  apiInternalErrorResponse: (message: string, error: unknown, context: unknown) => {
    logApiError(error, context);
    return Response.json({ error: message }, { status: 500 });
  },
}));

function request(body: unknown) {
  return new Request(`http://localhost${apiRoutes.wishlistAdd}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('POST /api/wishlist/add', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ id: 7, email: 'a@b.com' });
  });

  it('returns 401 when not authenticated', async () => {
    getSession.mockResolvedValue(null);

    const { POST } = await import('./route');
    const response = await POST(request({ scryfallId: 'abc' }));

    expect(response.status).toBe(401);
    expect(addToWishlist).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid JSON', async () => {
    const { POST } = await import('./route');
    const response = await POST(request('{bad'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON' });
  });

  it('returns 400 when scryfallId is missing', async () => {
    const { POST } = await import('./route');
    const response = await POST(request({ quantity: 1 }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Missing scryfallId' });
  });

  it.each([0, -1, 'two', null])('returns 400 for quantity %s', async (quantity) => {
    const { POST } = await import('./route');
    const response = await POST(request({ scryfallId: 'sid', quantity }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid quantity' });
  });

  it('returns 400 for an unknown finish', async () => {
    const { POST } = await import('./route');
    const response = await POST(request({ scryfallId: 'sid', finish: 'shiny' }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid finish' });
  });

  it('uses quantity 1 and finish "any" by default', async () => {
    addToWishlist.mockResolvedValue({ ok: true });

    const { POST } = await import('./route');
    const response = await POST(request({ scryfallId: ' sid ' }));

    expect(response.status).toBe(200);
    expect(addToWishlist).toHaveBeenCalledWith({
      userId: 7,
      scryfallId: 'sid',
      quantity: 1,
      finish: 'any',
    });
  });

  it('passes the finish and quantity to addToWishlist', async () => {
    addToWishlist.mockResolvedValue({ ok: true, wishlistPrintingId: 3 });

    const { POST } = await import('./route');
    const response = await POST(request({ scryfallId: 'sid', quantity: 2, finish: 'etched' }));

    expect(addToWishlist).toHaveBeenCalledWith({
      userId: 7,
      scryfallId: 'sid',
      quantity: 2,
      finish: 'etched',
    });
    await expect(response.json()).resolves.toEqual({ ok: true, wishlistPrintingId: 3 });
  });

  it('returns 500 when addToWishlist fails', async () => {
    addToWishlist.mockRejectedValue(new Error('db down'));

    const { POST } = await import('./route');
    const response = await POST(request({ scryfallId: 'sid' }));

    expect(response.status).toBe(500);
    expect(logApiError).toHaveBeenCalled();
  });
});
