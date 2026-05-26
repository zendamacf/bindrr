import { afterEach, describe, expect, it, vi } from 'vitest';
import { unauthorizedCronResponse } from './verifyCronSecret';

describe('unauthorizedCronResponse', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns null in development without CRON_SECRET', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('CRON_SECRET', '');

    expect(unauthorizedCronResponse(new Request('http://localhost'))).toBeNull();
  });

  it('returns 503 in production when CRON_SECRET is missing', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CRON_SECRET', '');

    const response = unauthorizedCronResponse(new Request('http://localhost'));

    expect(response?.status).toBe(503);
    await expect(response?.json()).resolves.toEqual({
      error: 'CRON_SECRET is not configured',
    });
  });

  it('returns 401 when the bearer token does not match', async () => {
    vi.stubEnv('CRON_SECRET', 'secret');

    const response = unauthorizedCronResponse(
      new Request('http://localhost', { headers: { authorization: 'Bearer wrong' } }),
    );

    expect(response?.status).toBe(401);
  });
});
