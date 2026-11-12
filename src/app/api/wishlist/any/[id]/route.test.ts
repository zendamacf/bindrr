import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRoutes } from '@/routes';

const getSession = vi.fn();
const updateWishlistAny = vi.fn();

vi.mock('@/utils/auth/session', () => ({ getSession }));
vi.mock('@/lib/wishlist/updateWishlistAny', () => ({ updateWishlistAny }));
vi.mock('@/lib/api/errors', () => ({
  apiInternalErrorResponse: (message: string) => Response.json({ error: message }, { status: 500 }),
}));

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
function req(method: string, body?: unknown) {
  return new Request(`http://localhost${apiRoutes.wishlistAnyItem(3)}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('/api/wishlist/any/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ id: 7, email: 'a@b.com' });
  });

  it('returns 401 when not authenticated', async () => {
    getSession.mockResolvedValue(null);
    const { PATCH, DELETE } = await import('./route');

    expect((await PATCH(req('PATCH', { quantity: 1 }), ctx('3'))).status).toBe(401);
    expect((await DELETE(req('DELETE'), ctx('3'))).status).toBe(401);
  });

  it('returns 400 for an invalid id', async () => {
    const { PATCH, DELETE } = await import('./route');

    expect((await PATCH(req('PATCH', { quantity: 1 }), ctx('x'))).status).toBe(400);
    expect((await DELETE(req('DELETE'), ctx('0'))).status).toBe(400);
  });

  it.each([
    ['{bad', 'Invalid JSON'],
    [{}, 'Missing quantity or finish'],
    [{ quantity: -1 }, 'Invalid quantity'],
    [{ finish: 'shiny' }, 'Invalid finish'],
  ])('PATCH returns 400 for %j', async (body, error) => {
    const { PATCH } = await import('./route');
    const response = await PATCH(req('PATCH', body), ctx('3'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error });
  });

  it('PATCH passes the changes through, and returns 404 when missing', async () => {
    updateWishlistAny.mockResolvedValue({ ok: true, removed: false });
    const { PATCH } = await import('./route');

    const ok = await PATCH(req('PATCH', { quantity: 2, finish: 'foil' }), ctx('3'));
    expect(ok.status).toBe(200);
    expect(updateWishlistAny).toHaveBeenCalledWith({
      userId: 7,
      wishlistCardId: 3,
      quantity: 2,
      finish: 'foil',
    });

    updateWishlistAny.mockResolvedValue(null);
    expect((await PATCH(req('PATCH', { quantity: 2 }), ctx('3'))).status).toBe(404);
  });

  it('PATCH returns 500 on failure', async () => {
    updateWishlistAny.mockRejectedValue(new Error('db'));
    const { PATCH } = await import('./route');

    expect((await PATCH(req('PATCH', { quantity: 2 }), ctx('3'))).status).toBe(500);
  });

  it('DELETE removes the entry, 404 when missing, 500 on failure', async () => {
    const { DELETE } = await import('./route');

    updateWishlistAny.mockResolvedValue({ ok: true, removed: true });
    expect((await DELETE(req('DELETE'), ctx('3'))).status).toBe(200);
    expect(updateWishlistAny).toHaveBeenCalledWith({
      userId: 7,
      wishlistCardId: 3,
      quantity: 0,
    });

    updateWishlistAny.mockResolvedValue(null);
    expect((await DELETE(req('DELETE'), ctx('3'))).status).toBe(404);

    updateWishlistAny.mockRejectedValue(new Error('db'));
    expect((await DELETE(req('DELETE'), ctx('3'))).status).toBe(500);
  });
});
