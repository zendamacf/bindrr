import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRoutes } from '@/routes';

const getSession = vi.fn();
const getWishlistAnyPrintings = vi.fn();

vi.mock('@/utils/auth/session', () => ({ getSession }));
vi.mock('@/lib/wishlist/getWishlistAnyPrintings', () => ({ getWishlistAnyPrintings }));
vi.mock('@/lib/api/errors', () => ({
  apiInternalErrorResponse: (message: string) => Response.json({ error: message }, { status: 500 }),
}));

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const req = () => new Request(`http://localhost${apiRoutes.wishlistAnyPrintings(3)}`);

describe('GET /api/wishlist/any/[id]/printings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ id: 7, email: 'a@b.com' });
  });

  it('returns 401 when not authenticated', async () => {
    getSession.mockResolvedValue(null);
    const { GET } = await import('./route');
    expect((await GET(req(), ctx('3'))).status).toBe(401);
  });

  it('returns 400 for an invalid id', async () => {
    const { GET } = await import('./route');
    expect((await GET(req(), ctx('x'))).status).toBe(400);
  });

  it('returns 404 when the entry is missing', async () => {
    getWishlistAnyPrintings.mockResolvedValue(null);
    const { GET } = await import('./route');
    expect((await GET(req(), ctx('3'))).status).toBe(404);
  });

  it('returns the printings for the user', async () => {
    getWishlistAnyPrintings.mockResolvedValue({ name: 'Bolt', printings: [], currencyCode: 'USD' });
    const { GET } = await import('./route');
    const response = await GET(req(), ctx('3'));

    expect(response.status).toBe(200);
    expect(getWishlistAnyPrintings).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 7, wishlistCardId: 3 }),
    );
  });

  it('returns 500 on failure', async () => {
    getWishlistAnyPrintings.mockRejectedValue(new Error('db'));
    const { GET } = await import('./route');
    expect((await GET(req(), ctx('3'))).status).toBe(500);
  });
});
