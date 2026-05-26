import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchLatestExchangeRates } from './openexchangerates';

describe('fetchLatestExchangeRates', () => {
  beforeEach(() => {
    vi.stubEnv('OPENEXCHANGERATES_APPID', 'test-app-id');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('fetches USD-base rates from Open Exchange Rates', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rates: { USD: 1, AUD: 1.52, EUR: 0.91 } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const rates = await fetchLatestExchangeRates();

    expect(rates).toEqual({ USD: 1, AUD: 1.52, EUR: 0.91 });
    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(calledUrl.hostname).toBe('openexchangerates.org');
    expect(calledUrl.searchParams.get('app_id')).toBe('test-app-id');
    expect(calledUrl.searchParams.get('base')).toBe('USD');
  });

  it('throws when the API returns an error status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403 }));

    await expect(fetchLatestExchangeRates()).rejects.toThrow(
      'Open Exchange Rates request failed (403)',
    );
  });
});
