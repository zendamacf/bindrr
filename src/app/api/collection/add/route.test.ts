import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRoutes } from '@/routes';

const getSession = vi.fn();
const addToCollection = vi.fn();

vi.mock('@/utils/auth/session', () => ({ getSession }));
vi.mock('@/lib/collection/addToCollection', () => ({ addToCollection }));

function request(body: unknown) {
  return new Request(`http://localhost${apiRoutes.collectionAdd}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/collection/add', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    getSession.mockResolvedValue(null);

    const { POST } = await import('./route');
    const response = await POST(request({ scryfallId: 'abc', quantity: 1, foil: false }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 400 when missing scryfallId', async () => {
    getSession.mockResolvedValue({ id: 1, email: 'a@b.com' });

    const { POST } = await import('./route');
    const response = await POST(request({ quantity: 1, foil: false }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Missing scryfallId' });
  });

  it('calls addToCollection for the signed-in user', async () => {
    getSession.mockResolvedValue({ id: 7, email: 'a@b.com' });
    addToCollection.mockResolvedValue({ ok: true });

    const { POST } = await import('./route');
    const response = await POST(request({ scryfallId: 'sid', quantity: 2, foil: true }));

    expect(response.status).toBe(200);
    expect(addToCollection).toHaveBeenCalledWith({
      userId: 7,
      scryfallId: 'sid',
      quantity: 2,
      finish: 'foil',
    });
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it('accepts finish etched', async () => {
    getSession.mockResolvedValue({ id: 7, email: 'a@b.com' });
    addToCollection.mockResolvedValue({ ok: true });

    const { POST } = await import('./route');
    const response = await POST(request({ scryfallId: 'sid', quantity: 1, finish: 'etched' }));

    expect(response.status).toBe(200);
    expect(addToCollection).toHaveBeenCalledWith({
      userId: 7,
      scryfallId: 'sid',
      quantity: 1,
      finish: 'etched',
    });
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
