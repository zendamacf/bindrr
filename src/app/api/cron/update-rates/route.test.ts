import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRoutes } from '@/routes';

const updateExchangeRates = vi.fn();

vi.mock('@/lib/exchange-rates/updateExchangeRates', () => ({
  updateExchangeRates,
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
