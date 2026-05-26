import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSession = vi.fn();
const getCollectionItem = vi.fn();
const updateCollectionItem = vi.fn();
const logApiError = vi.fn();

vi.mock('@/utils/auth/session', () => ({ getSession }));
vi.mock('@/lib/collection/getCollectionItem', () => ({ getCollectionItem }));
vi.mock('@/lib/collection/updateCollectionItem', () => ({ updateCollectionItem }));
vi.mock('@/lib/api/errors', () => ({
  apiInternalErrorResponse: (message: string, error: unknown, context: unknown) => {
    logApiError(error, context);
    return Response.json({ error: message }, { status: 500 });
  },
}));

function request(url: string, init?: RequestInit) {
  return new Request(`http://localhost${url}`, init);
}

describe('/api/collection/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns 400 for an invalid id', async () => {
    getSession.mockResolvedValue({ id: 3, email: 'a@b.com' });

    const { GET } = await import('./route');
    const response = await GET(request('/api/collection/abc'), {
      params: Promise.resolve({ id: 'abc' }),
    });

    expect(response.status).toBe(400);
    expect(getCollectionItem).not.toHaveBeenCalled();
  });

  it('GET returns 404 when the item is missing', async () => {
    getSession.mockResolvedValue({ id: 3, email: 'a@b.com' });
    getCollectionItem.mockResolvedValue(null);

    const { GET } = await import('./route');
    const response = await GET(request('/api/collection/5'), {
      params: Promise.resolve({ id: '5' }),
    });

    expect(response.status).toBe(404);
  });

  it('GET returns 401 when not authenticated', async () => {
    getSession.mockResolvedValue(null);

    const { GET } = await import('./route');
    const response = await GET(request('/api/collection/1'), {
      params: Promise.resolve({ id: '1' }),
    });

    expect(response.status).toBe(401);
  });

  it('GET returns 500 when loading fails', async () => {
    getSession.mockResolvedValue({ id: 3, email: 'a@b.com' });
    getCollectionItem.mockRejectedValue(new Error('db down'));

    const { GET } = await import('./route');
    const response = await GET(request('/api/collection/5'), {
      params: Promise.resolve({ id: '5' }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Failed to load card' });
    expect(logApiError).toHaveBeenCalledWith(new Error('db down'), {
      route: '/api/collection/[id]',
      method: 'GET',
      userId: 3,
    });
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
    updateCollectionItem.mockResolvedValue({ ok: true, removed: false });

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
    expect(updateCollectionItem).toHaveBeenCalledWith({
      userId: 3,
      collectionPrintingId: 5,
      quantity: 3,
    });
  });

  it('PATCH returns 400 for invalid JSON', async () => {
    getSession.mockResolvedValue({ id: 3, email: 'a@b.com' });

    const { PATCH } = await import('./route');
    const response = await PATCH(
      request('/api/collection/5', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: 'not-json',
      }),
      { params: Promise.resolve({ id: '5' }) },
    );

    expect(response.status).toBe(400);
    expect(updateCollectionItem).not.toHaveBeenCalled();
  });

  it('PATCH returns 400 when body has no quantity or finish', async () => {
    getSession.mockResolvedValue({ id: 3, email: 'a@b.com' });

    const { PATCH } = await import('./route');
    const response = await PATCH(
      request('/api/collection/5', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: '5' }) },
    );

    expect(response.status).toBe(400);
  });

  it('PATCH returns 500 when update fails', async () => {
    getSession.mockResolvedValue({ id: 3, email: 'a@b.com' });
    updateCollectionItem.mockRejectedValue(new Error('db down'));

    const { PATCH } = await import('./route');
    const response = await PATCH(
      request('/api/collection/5', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ quantity: 1 }),
      }),
      { params: Promise.resolve({ id: '5' }) },
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Failed to update card' });
    expect(logApiError).toHaveBeenCalledWith(new Error('db down'), {
      route: '/api/collection/[id]',
      method: 'PATCH',
      userId: 3,
    });
  });

  it('PATCH updates finish', async () => {
    getSession.mockResolvedValue({ id: 3, email: 'a@b.com' });
    updateCollectionItem.mockResolvedValue({
      ok: true,
      removed: false,
      collectionPrintingId: 9,
    });

    const { PATCH } = await import('./route');
    const response = await PATCH(
      request('/api/collection/5', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ quantity: 2, finish: 'nonfoil' }),
      }),
      { params: Promise.resolve({ id: '5' }) },
    );

    expect(response.status).toBe(200);
    expect(updateCollectionItem).toHaveBeenCalledWith({
      userId: 3,
      collectionPrintingId: 5,
      quantity: 2,
      finish: 'nonfoil',
    });
    await expect(response.json()).resolves.toEqual({
      ok: true,
      removed: false,
      collectionPrintingId: 9,
    });
  });

  it('DELETE returns 500 when removal fails', async () => {
    getSession.mockResolvedValue({ id: 3, email: 'a@b.com' });
    updateCollectionItem.mockRejectedValue(new Error('db down'));

    const { DELETE } = await import('./route');
    const response = await DELETE(request('/api/collection/5'), {
      params: Promise.resolve({ id: '5' }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Failed to remove card' });
    expect(logApiError).toHaveBeenCalledWith(new Error('db down'), {
      route: '/api/collection/[id]',
      method: 'DELETE',
      userId: 3,
    });
  });

  it('DELETE removes the card', async () => {
    getSession.mockResolvedValue({ id: 3, email: 'a@b.com' });
    updateCollectionItem.mockResolvedValue({ ok: true, removed: true });

    const { DELETE } = await import('./route');
    const response = await DELETE(request('/api/collection/5'), {
      params: Promise.resolve({ id: '5' }),
    });

    expect(response.status).toBe(200);
    expect(updateCollectionItem).toHaveBeenCalledWith({
      userId: 3,
      collectionPrintingId: 5,
      quantity: 0,
    });
  });
});
