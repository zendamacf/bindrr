import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiInternalErrorResponse, logApiError } from './errors';

const captureException = vi.fn();
const consoleError = vi.fn();

vi.mock('@sentry/nextjs', () => ({
  captureException: (...args: unknown[]) => captureException(...args),
}));

describe('logApiError', () => {
  beforeEach(() => {
    captureException.mockClear();
    consoleError.mockClear();
    vi.stubGlobal('console', { ...console, error: consoleError });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('logs route context and error details to the console', () => {
    const error = new Error('db down');

    logApiError(error, { route: '/api/collection', method: 'GET', userId: 1 });

    expect(consoleError).toHaveBeenCalledWith('[api] GET /api/collection failed', {
      route: '/api/collection',
      method: 'GET',
      userId: 1,
      error: 'db down',
      stack: error.stack,
    });
  });

  it('coerces non-Error values before logging', () => {
    logApiError('timeout', { route: '/api/cards/search' });

    expect(consoleError).toHaveBeenCalledWith(
      '[api] GET /api/cards/search failed',
      expect.objectContaining({ error: 'timeout' }),
    );
  });

  it('reports to Sentry outside development', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const error = new Error('upstream');
    logApiError(error, { route: '/api/cron/update-rates', method: 'GET' });

    await vi.waitFor(() => {
      expect(captureException).toHaveBeenCalledWith(error, {
        extra: { route: '/api/cron/update-rates', method: 'GET' },
      });
    });
  });

  it('skips Sentry in development', () => {
    vi.stubEnv('NODE_ENV', 'development');

    logApiError(new Error('local'), { route: '/api/collection' });

    expect(captureException).not.toHaveBeenCalled();
  });
});

describe('apiInternalErrorResponse', () => {
  beforeEach(() => {
    captureException.mockClear();
    consoleError.mockClear();
    vi.stubGlobal('console', { ...console, error: consoleError });
    vi.stubEnv('NODE_ENV', 'development');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('returns a 500 JSON body after logging', async () => {
    const response = apiInternalErrorResponse('Failed to load collection', new Error('db'), {
      route: '/api/collection',
      method: 'GET',
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Failed to load collection' });
    expect(consoleError).toHaveBeenCalledOnce();
  });
});
