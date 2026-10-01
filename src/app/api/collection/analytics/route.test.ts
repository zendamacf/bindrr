import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PREFERRED_CURRENCY_HEADER } from '@/lib/currency/header';
import { apiRoutes } from '@/routes';

const getSession = vi.fn();
const getCollectionAnalytics = vi.fn();
const logApiError = vi.fn();

vi.mock('@/utils/auth/session', () => ({ getSession }));
vi.mock('@/lib/collection/getCollectionAnalytics', () => ({
  getCollectionAnalytics,
  parseCollectionAnalyticsDaysParam: (value: string | null) => {
    if (value == null || value === '') return undefined;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  },
}));
vi.mock('@/lib/api/errors', () => ({
  apiInternalErrorResponse: (message: string, error: unknown, context: unknown) => {
    logApiError(error, context);
    return Response.json({ error: message }, { status: 500 });
  },
}));

function request(url: string, currency = 'EUR') {
  return new Request(`http://localhost${url}`, {
    headers: { [PREFERRED_CURRENCY_HEADER]: currency },
  });
}

describe('GET /api/collection/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    getSession.mockResolvedValue(null);

    const { GET } = await import('./route');
    const response = await GET(request(`${apiRoutes.collectionAnalytics}?days=30`));

    expect(response.status).toBe(401);
    expect(getCollectionAnalytics).not.toHaveBeenCalled();
  });

  it('returns analytics for the signed-in user', async () => {
    getSession.mockResolvedValue({ id: 3, email: 'a@b.com' });
    getCollectionAnalytics.mockResolvedValue({
      currencyCode: 'USD',
      totalCards: 10,
      totalValue: 42,
      valueOverTime: [],
      windowDays: 90,
      bySet: [],
      byRarity: [],
      byFinish: [],
    });

    const { GET } = await import('./route');
    const response = await GET(request(`${apiRoutes.collectionAnalytics}?days=30`));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ totalValue: 42, currencyCode: 'USD' });
    expect(getCollectionAnalytics).toHaveBeenCalledWith({
      userId: 3,
      currencyCode: 'EUR',
      days: 30,
    });
  });

  it('returns 500 when analytics loading fails', async () => {
    getSession.mockResolvedValue({ id: 1, email: 'a@b.com' });
    getCollectionAnalytics.mockRejectedValue(new Error('db down'));

    const { GET } = await import('./route');
    const response = await GET(request(apiRoutes.collectionAnalytics));

    expect(response.status).toBe(500);
    expect(logApiError).toHaveBeenCalled();
  });
});
