import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PREFERRED_CURRENCY_HEADER } from '@/lib/currency/header';

const getSession = vi.fn();
const getCollectionItemPriceHistory = vi.fn();
const logApiError = vi.fn();

vi.mock('@/utils/auth/session', () => ({ getSession }));
vi.mock('@/lib/collection/getPrintingPriceHistory', () => ({
  getCollectionItemPriceHistory,
  parsePriceHistoryDaysParam: (value: string | null) => {
    if (value === '90') return 90;
    return undefined;
  },
}));
vi.mock('@/lib/api/errors', () => ({
  apiInternalErrorResponse: (message: string, error: unknown, context: unknown) => {
    logApiError(error, context);
    return Response.json({ error: message }, { status: 500 });
  },
}));

function request(url: string, currency = 'USD') {
  const headers = new Headers();
  headers.set(PREFERRED_CURRENCY_HEADER, currency);
  return new Request(`http://localhost${url}`, { headers });
}

describe('GET /api/collection/[id]/price-history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    getSession.mockResolvedValue(null);

    const { GET } = await import('./route');
    const response = await GET(request('/api/collection/1/price-history'), {
      params: Promise.resolve({ id: '1' }),
    });

    expect(response.status).toBe(401);
  });

  it('returns 400 for an invalid id', async () => {
    getSession.mockResolvedValue({ id: 3, email: 'a@b.com' });

    const { GET } = await import('./route');
    const response = await GET(request('/api/collection/abc/price-history'), {
      params: Promise.resolve({ id: 'abc' }),
    });

    expect(response.status).toBe(400);
    expect(getCollectionItemPriceHistory).not.toHaveBeenCalled();
  });

  it('returns 404 when the item is missing', async () => {
    getSession.mockResolvedValue({ id: 3, email: 'a@b.com' });
    getCollectionItemPriceHistory.mockResolvedValue(null);

    const { GET } = await import('./route');
    const response = await GET(request('/api/collection/5/price-history'), {
      params: Promise.resolve({ id: '5' }),
    });

    expect(response.status).toBe(404);
  });

  it('returns price history for the signed-in user', async () => {
    getSession.mockResolvedValue({ id: 3, email: 'a@b.com' });
    getCollectionItemPriceHistory.mockResolvedValue({
      currencyCode: 'EUR',
      points: [{ date: '2026-01-01', nonfoil: 1, foil: null, etched: null }],
      series: {
        nonfoil: { hasData: true },
        foil: { hasData: false },
        etched: { hasData: false },
      },
    });

    const { GET } = await import('./route');
    const response = await GET(request('/api/collection/5/price-history?days=90', 'EUR'), {
      params: Promise.resolve({ id: '5' }),
    });

    expect(response.status).toBe(200);
    expect(getCollectionItemPriceHistory).toHaveBeenCalledWith(3, 5, 'EUR', { days: 90 });
    await expect(response.json()).resolves.toEqual({
      currencyCode: 'EUR',
      points: [{ date: '2026-01-01', nonfoil: 1, foil: null, etched: null }],
      series: {
        nonfoil: { hasData: true },
        foil: { hasData: false },
        etched: { hasData: false },
      },
    });
  });

  it('returns 500 when loading fails', async () => {
    getSession.mockResolvedValue({ id: 3, email: 'a@b.com' });
    getCollectionItemPriceHistory.mockRejectedValue(new Error('db down'));

    const { GET } = await import('./route');
    const response = await GET(request('/api/collection/5/price-history'), {
      params: Promise.resolve({ id: '5' }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Failed to load price history' });
    expect(logApiError).toHaveBeenCalledWith(new Error('db down'), {
      route: '/api/collection/[id]/price-history',
      method: 'GET',
      userId: 3,
    });
  });
});
