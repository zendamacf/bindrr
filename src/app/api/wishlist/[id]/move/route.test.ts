import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getSession, moveWishlistToCollection, logApiError, InvalidMoveQuantityError } = vi.hoisted(
  () => ({
    getSession: vi.fn(),
    moveWishlistToCollection: vi.fn(),
    logApiError: vi.fn(),
    InvalidMoveQuantityError: class InvalidMoveQuantityError extends Error {},
  }),
);

vi.mock('@/utils/auth/session', () => ({ getSession }));
vi.mock('@/lib/wishlist/moveWishlistToCollection', () => ({
  moveWishlistToCollection,
  InvalidMoveQuantityError,
}));
vi.mock('@/lib/api/errors', () => ({
  apiInternalErrorResponse: (message: string, error: unknown, context: unknown) => {
    logApiError(error, context);
    return Response.json({ error: message }, { status: 500 });
  },
}));

function context(id: string) {
  return { params: Promise.resolve({ id }) };
}

function post(body: unknown) {
  return new Request('http://localhost/api/wishlist/5/move', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('POST /api/wishlist/[id]/move', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ id: 3, email: 'a@b.com' });
  });

  it('returns 401 when not authenticated', async () => {
    getSession.mockResolvedValue(null);

    const { POST } = await import('./route');
    const response = await POST(post({ finish: 'foil' }), context('5'));

    expect(response.status).toBe(401);
    expect(moveWishlistToCollection).not.toHaveBeenCalled();
  });

  it('returns 400 for an invalid id', async () => {
    const { POST } = await import('./route');
    const response = await POST(post({ finish: 'foil' }), context('abc'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid id' });
  });

  it('returns 400 for invalid JSON', async () => {
    const { POST } = await import('./route');
    const response = await POST(post('{bad'), context('5'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON' });
  });

  it.each([undefined, 'any', 'shiny', 3])('returns 400 for the finish %s', async (finish) => {
    const { POST } = await import('./route');
    const response = await POST(post({ finish }), context('5'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Missing or invalid finish' });
    expect(moveWishlistToCollection).not.toHaveBeenCalled();
  });

  it.each([0, -2, 'two', null])('returns 400 for the quantity %s', async (quantity) => {
    const { POST } = await import('./route');
    const response = await POST(post({ finish: 'foil', quantity }), context('5'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid quantity' });
    expect(moveWishlistToCollection).not.toHaveBeenCalled();
  });

  it('returns 404 when the item is missing', async () => {
    moveWishlistToCollection.mockResolvedValue(null);

    const { POST } = await import('./route');
    const response = await POST(post({ finish: 'foil' }), context('5'));

    expect(response.status).toBe(404);
  });

  it('returns 400 when the quantity is above the wanted quantity', async () => {
    moveWishlistToCollection.mockRejectedValue(new InvalidMoveQuantityError());

    const { POST } = await import('./route');
    const response = await POST(post({ finish: 'foil', quantity: 9 }), context('5'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid quantity' });
    expect(logApiError).not.toHaveBeenCalled();
  });

  it('moves all copies when there is no quantity', async () => {
    const result = { ok: true, collectionPrintingId: 8, printingId: 2, moved: 3, remaining: 0 };
    moveWishlistToCollection.mockResolvedValue(result);

    const { POST } = await import('./route');
    const response = await POST(post({ finish: 'etched' }), context('5'));

    expect(response.status).toBe(200);
    expect(moveWishlistToCollection).toHaveBeenCalledWith({
      userId: 3,
      wishlistPrintingId: 5,
      finish: 'etched',
    });
    await expect(response.json()).resolves.toEqual(result);
  });

  it('passes the quantity to the move', async () => {
    moveWishlistToCollection.mockResolvedValue({ ok: true });

    const { POST } = await import('./route');
    await POST(post({ finish: 'nonfoil', quantity: 2 }), context('5'));

    expect(moveWishlistToCollection).toHaveBeenCalledWith({
      userId: 3,
      wishlistPrintingId: 5,
      finish: 'nonfoil',
      quantity: 2,
    });
  });

  it('returns 500 when the move fails', async () => {
    moveWishlistToCollection.mockRejectedValue(new Error('db down'));

    const { POST } = await import('./route');
    const response = await POST(post({ finish: 'foil' }), context('5'));

    expect(response.status).toBe(500);
    expect(logApiError).toHaveBeenCalled();
  });
});
