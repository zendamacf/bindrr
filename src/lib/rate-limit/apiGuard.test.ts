import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetRateLimitStore } from './store';

describe('checkApiRateLimit', () => {
  beforeEach(() => {
    resetRateLimitStore();
    vi.stubEnv('RATE_LIMIT_SEARCH_MAX', '2');
    vi.stubEnv('RATE_LIMIT_SEARCH_WINDOW_MS', '60000');
    vi.stubEnv('RATE_LIMIT_API_AUTH_MAX', '2');
    vi.stubEnv('RATE_LIMIT_API_AUTH_WINDOW_MS', '60000');
  });

  afterEach(() => {
    resetRateLimitStore();
    vi.unstubAllEnvs();
  });

  it('returns 429 for search tier when exceeded', async () => {
    const { checkApiRateLimit } = await import('./apiGuard');
    const request = new Request('http://localhost/api/cards/search');

    expect(checkApiRateLimit(request, 42, 'search')).toBeNull();
    expect(checkApiRateLimit(request, 42, 'search')).toBeNull();
    const blocked = checkApiRateLimit(request, 42, 'search');

    expect(blocked?.status).toBe(429);
    await expect(blocked?.json()).resolves.toMatchObject({
      error: 'Too many requests. Please try again later.',
    });
    expect(blocked?.headers.get('Retry-After')).toBeTruthy();
  });

  it('rate limits unauthenticated API calls by IP', async () => {
    const { checkApiRateLimit } = await import('./apiGuard');
    vi.stubEnv('RATE_LIMIT_API_ANON_MAX', '1');
    const request = new Request('http://localhost/api/collection', {
      headers: { 'x-forwarded-for': '198.51.100.9' },
    });

    expect(checkApiRateLimit(request, null, 'default')).toBeNull();
    const blocked = checkApiRateLimit(request, null, 'default');

    expect(blocked?.status).toBe(429);
  });

  it('applies separate buckets per authenticated user', async () => {
    const { checkApiRateLimit } = await import('./apiGuard');
    const request = new Request('http://localhost/api/collection');

    expect(checkApiRateLimit(request, 1, 'default')).toBeNull();
    expect(checkApiRateLimit(request, 1, 'default')).toBeNull();
    expect(checkApiRateLimit(request, 2, 'default')).toBeNull();
    const blocked = checkApiRateLimit(request, 1, 'default');

    expect(blocked?.status).toBe(429);
  });
});
