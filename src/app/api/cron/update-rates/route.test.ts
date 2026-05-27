import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRoutes } from '@/routes';

const updateExchangeRates = vi.fn();
const invalidateExchangeRatesCache = vi.fn();
const logApiError = vi.fn();

vi.mock('@/lib/exchange-rates/updateExchangeRates', () => ({
  updateExchangeRates,
}));
vi.mock('@/lib/cache/invalidateExchangeRates', () => ({
  invalidateExchangeRatesCache,
}));
vi.mock('@/lib/api/errors', () => ({
  apiInternalErrorResponse: (message: string, error: unknown, context: unknown) => {
    logApiError(error, context);
    return Response.json({ error: message }, { status: 500 });
  },
}));

function request(method: 'GET' | 'POST', headers?: HeadersInit) {
  return new Request(`http://localhost${apiRoutes.cronUpdateRates}`, {
    method,
    headers,
  });
}

describe('cron update-rates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('returns 401 without a valid cron secret in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CRON_SECRET', 'secret');

    const { GET } = await import('./route');
    const response = await GET(request('GET'));

    expect(response.status).toBe(401);
    expect(updateExchangeRates).not.toHaveBeenCalled();
  });

  it('updates rates when authorized', async () => {
    vi.stubEnv('CRON_SECRET', 'secret');
    updateExchangeRates.mockResolvedValue({ updated: 170 });

    const { POST } = await import('./route');
    const response = await POST(request('POST', { authorization: 'Bearer secret' }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, updated: 170 });
    expect(updateExchangeRates).toHaveBeenCalled();
    expect(invalidateExchangeRatesCache).toHaveBeenCalled();
  });

  it('returns 500 when updateExchangeRates fails', async () => {
    vi.stubEnv('CRON_SECRET', 'secret');
    updateExchangeRates.mockRejectedValue(new Error('upstream failed'));

    const { GET } = await import('./route');
    const response = await GET(request('GET', { authorization: 'Bearer secret' }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Failed to update exchange rates' });
    expect(logApiError).toHaveBeenCalledWith(new Error('upstream failed'), {
      route: '/api/cron/update-rates',
      method: 'GET',
    });
    expect(invalidateExchangeRatesCache).not.toHaveBeenCalled();
  });

  it('allows unauthenticated requests in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    updateExchangeRates.mockResolvedValue({ updated: 5 });

    const { GET } = await import('./route');
    const response = await GET(request('GET'));

    expect(response.status).toBe(200);
    expect(updateExchangeRates).toHaveBeenCalled();
  });
});
