import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSession = vi.fn();
const getCollectionItem = vi.fn();
const updateCollectionItemQuantity = vi.fn();

vi.mock('@/utils/auth/session', () => ({ getSession }));
vi.mock('@/lib/collection/getCollectionItem', () => ({ getCollectionItem }));
vi.mock('@/lib/collection/updateCollectionItem', () => ({ updateCollectionItemQuantity }));

function request(url: string, init?: RequestInit) {
  return new Request(`http://localhost${url}`, init);
}

describe('/api/collection/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns 401 when not authenticated', async () => {
    getSession.mockResolvedValue(null);

    const { GET } = await import('./route');
    const response = await GET(request('/api/collection/1'), {
      params: Promise.resolve({ id: '1' }),
    });

    expect(response.status).toBe(401);
  });

  it('GET returns item for the signed-in user', async () => {
    getSession.mockResolvedValue({ id: 3, email: 'a@b.com' });
    getCollectionItem.mockResolvedValue({
      collectionPrintingId: 5,
      name: 'Bolt',
      history: [],
    });

    const { GET } = await import('./route');
    const response = await GET(request('/api/collection/5'), {
      params: Promise.resolve({ id: '5' }),
    });

    expect(response.status).toBe(200);
    expect(getCollectionItem).toHaveBeenCalledWith(3, 5);
    await expect(response.json()).resolves.toEqual({
      item: { collectionPrintingId: 5, name: 'Bolt', history: [] },
    });
  });

  it('PATCH updates quantity', async () => {
    getSession.mockResolvedValue({ id: 3, email: 'a@b.com' });
    updateCollectionItemQuantity.mockResolvedValue({ ok: true, removed: false });

    const { PATCH } = await import('./route');
    const response = await PATCH(
      request('/api/collection/5', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ quantity: 3 }),
      }),
      { params: Promise.resolve({ id: '5' }) },
    );

    expect(response.status).toBe(200);
    expect(updateCollectionItemQuantity).toHaveBeenCalledWith({
      userId: 3,
      collectionPrintingId: 5,
      quantity: 3,
    });
  });

  it('DELETE removes the card', async () => {
    getSession.mockResolvedValue({ id: 3, email: 'a@b.com' });
    updateCollectionItemQuantity.mockResolvedValue({ ok: true, removed: true });

    const { DELETE } = await import('./route');
    const response = await DELETE(request('/api/collection/5'), {
      params: Promise.resolve({ id: '5' }),
    });

    expect(response.status).toBe(200);
    expect(updateCollectionItemQuantity).toHaveBeenCalledWith({
      userId: 3,
      collectionPrintingId: 5,
      quantity: 0,
    });
  });
});
