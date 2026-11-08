import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSession = vi.fn();
const updateWishlistItem = vi.fn();
const logApiError = vi.fn();

vi.mock('@/utils/auth/session', () => ({ getSession }));
vi.mock('@/lib/wishlist/updateWishlistItem', () => ({ updateWishlistItem }));
vi.mock('@/lib/api/errors', () => ({
  apiInternalErrorResponse: (message: string, error: unknown, context: unknown) => {
    logApiError(error, context);
    return Response.json({ error: message }, { status: 500 });
  },
}));

function context(id: string) {
  return { params: Promise.resolve({ id }) };
}

function patch(body: unknown) {
  return new Request('http://localhost/api/wishlist/5', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function del() {
  return new Request('http://localhost/api/wishlist/5', { method: 'DELETE' });
}

describe('/api/wishlist/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ id: 3, email: 'a@b.com' });
  });

  describe('PATCH', () => {
    it('returns 401 when not authenticated', async () => {
      getSession.mockResolvedValue(null);

      const { PATCH } = await import('./route');
      const response = await PATCH(patch({ quantity: 1 }), context('5'));

      expect(response.status).toBe(401);
    });

    it('returns 400 for an invalid id', async () => {
      const { PATCH } = await import('./route');
      const response = await PATCH(patch({ quantity: 1 }), context('abc'));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'Invalid id' });
    });

    it('returns 400 for invalid JSON', async () => {
      const { PATCH } = await import('./route');
      const response = await PATCH(patch('{bad'), context('5'));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON' });
    });

    it('returns 400 when there is no quantity or finish', async () => {
      const { PATCH } = await import('./route');
      const response = await PATCH(patch({}), context('5'));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'Missing quantity or finish' });
    });

    it.each([-1, 'two', null])('returns 400 for quantity %s', async (quantity) => {
      const { PATCH } = await import('./route');
      const response = await PATCH(patch({ quantity }), context('5'));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'Invalid quantity' });
    });

    it('returns 400 for an unknown finish', async () => {
      const { PATCH } = await import('./route');
      const response = await PATCH(patch({ finish: 'shiny' }), context('5'));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'Invalid finish' });
    });

    it('returns 404 when the item is missing', async () => {
      updateWishlistItem.mockResolvedValue(null);

      const { PATCH } = await import('./route');
      const response = await PATCH(patch({ quantity: 2 }), context('5'));

      expect(response.status).toBe(404);
    });

    it('updates the quantity and finish for the signed-in user', async () => {
      updateWishlistItem.mockResolvedValue({ ok: true, removed: false, wishlistPrintingId: 5 });

      const { PATCH } = await import('./route');
      const response = await PATCH(patch({ quantity: 2, finish: 'any' }), context('5'));

      expect(response.status).toBe(200);
      expect(updateWishlistItem).toHaveBeenCalledWith({
        userId: 3,
        wishlistPrintingId: 5,
        quantity: 2,
        finish: 'any',
      });
    });

    it('sends only the fields that the request has', async () => {
      updateWishlistItem.mockResolvedValue({ ok: true, removed: false });

      const { PATCH } = await import('./route');
      await PATCH(patch({ finish: 'foil' }), context('5'));

      expect(updateWishlistItem).toHaveBeenCalledWith({
        userId: 3,
        wishlistPrintingId: 5,
        finish: 'foil',
      });
    });

    it('returns 500 when the update fails', async () => {
      updateWishlistItem.mockRejectedValue(new Error('db down'));

      const { PATCH } = await import('./route');
      const response = await PATCH(patch({ quantity: 1 }), context('5'));

      expect(response.status).toBe(500);
      expect(logApiError).toHaveBeenCalled();
    });
  });

  describe('DELETE', () => {
    it('returns 401 when not authenticated', async () => {
      getSession.mockResolvedValue(null);

      const { DELETE } = await import('./route');
      const response = await DELETE(del(), context('5'));

      expect(response.status).toBe(401);
    });

    it('returns 400 for an invalid id', async () => {
      const { DELETE } = await import('./route');
      const response = await DELETE(del(), context('0'));

      expect(response.status).toBe(400);
    });

    it('returns 404 when the item is missing', async () => {
      updateWishlistItem.mockResolvedValue(null);

      const { DELETE } = await import('./route');
      const response = await DELETE(del(), context('5'));

      expect(response.status).toBe(404);
    });

    it('removes the item by setting the quantity to 0', async () => {
      updateWishlistItem.mockResolvedValue({ ok: true, removed: true });

      const { DELETE } = await import('./route');
      const response = await DELETE(del(), context('5'));

      expect(response.status).toBe(200);
      expect(updateWishlistItem).toHaveBeenCalledWith({
        userId: 3,
        wishlistPrintingId: 5,
        quantity: 0,
      });
    });

    it('returns 500 when the removal fails', async () => {
      updateWishlistItem.mockRejectedValue(new Error('db down'));

      const { DELETE } = await import('./route');
      const response = await DELETE(del(), context('5'));

      expect(response.status).toBe(500);
    });
  });
});
