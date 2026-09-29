import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as config from './config';
import { resetRateLimitStore } from './store';

const testLimits = {
  login: { maxAttempts: 10, windowMs: 15 * 60 * 1000 },
  search: { maxAttempts: 2, windowMs: 60_000 },
  apiAuthenticated: { maxAttempts: 2, windowMs: 60_000 },
  apiAnonymous: { maxAttempts: 60, windowMs: 60_000 },
};

describe('checkApiRateLimit', () => {
  beforeEach(() => {
    resetRateLimitStore();
    vi.spyOn(config, 'getRateLimitConfig').mockReturnValue(testLimits);
  });

  afterEach(() => {
    resetRateLimitStore();
    vi.restoreAllMocks();
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
    vi.spyOn(config, 'getRateLimitConfig').mockReturnValue({
      ...testLimits,
      apiAnonymous: { maxAttempts: 1, windowMs: 60_000 },
    });
    const { checkApiRateLimit } = await import('./apiGuard');
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
