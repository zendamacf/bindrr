import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRoutes } from '@/routes';

const syncCollectionPrintingPrices = vi.fn();
const logApiError = vi.fn();

vi.mock('@/lib/collection/syncPrintingPrices', () => ({
  syncCollectionPrintingPrices,
}));
vi.mock('@/lib/api/errors', () => ({
  apiInternalErrorResponse: (message: string, error: unknown, context: unknown) => {
    logApiError(error, context);
    return Response.json({ error: message }, { status: 500 });
  },
}));

function request(method: 'GET' | 'POST', headers?: HeadersInit) {
  return new Request(`http://localhost${apiRoutes.cronSyncPrices}`, {
    method,
    headers,
  });
}

describe('cron sync-prices', () => {
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
    expect(syncCollectionPrintingPrices).not.toHaveBeenCalled();
  });

  it('syncs collection printing prices when authorized', async () => {
    vi.stubEnv('CRON_SECRET', 'secret');
    syncCollectionPrintingPrices.mockResolvedValue({
      updated: 12,
      total: 15,
      nextIndex: 15,
      completed: true,
      resumed: false,
      skipped: false,
    });

    const { POST } = await import('./route');
    const response = await POST(request('POST', { authorization: 'Bearer secret' }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      updated: 12,
      total: 15,
      nextIndex: 15,
      completed: true,
      resumed: false,
      skipped: false,
    });
    expect(syncCollectionPrintingPrices).toHaveBeenCalled();
  });

  it('returns 500 when sync fails', async () => {
    vi.stubEnv('CRON_SECRET', 'secret');
    syncCollectionPrintingPrices.mockRejectedValue(new Error('scryfall down'));

    const { GET } = await import('./route');
    const response = await GET(request('GET', { authorization: 'Bearer secret' }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Failed to sync printing prices' });
    expect(logApiError).toHaveBeenCalledWith(new Error('scryfall down'), {
      route: '/api/cron/sync-prices',
      method: 'GET',
    });
  });
});
