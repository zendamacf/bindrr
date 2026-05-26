import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiInternalErrorResponse, logApiError } from './errors';

const captureException = vi.fn();
const logError = vi.fn();

vi.mock('@sentry/nextjs', () => ({
  captureException: (...args: unknown[]) => captureException(...args),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: (...args: unknown[]) => logError(...args),
  },
}));

describe('logApiError', () => {
  beforeEach(() => {
    captureException.mockClear();
    logError.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('logs route context and error details', () => {
    const error = new Error('db down');

    logApiError(error, { route: '/api/collection', method: 'GET', userId: 1 });

    expect(logError).toHaveBeenCalledWith(
      {
        route: '/api/collection',
        method: 'GET',
        userId: 1,
        error: 'db down',
        stack: error.stack,
      },
      '[api] GET /api/collection failed',
    );
  });

  it('coerces non-Error values before logging', () => {
    logApiError('timeout', { route: '/api/cards/search' });

    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'timeout' }),
      '[api] GET /api/cards/search failed',
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
    logError.mockClear();
    vi.stubEnv('NODE_ENV', 'development');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns a 500 JSON body after logging', async () => {
    const response = apiInternalErrorResponse('Failed to load collection', new Error('db'), {
      route: '/api/collection',
      method: 'GET',
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Failed to load collection' });
    expect(logError).toHaveBeenCalledOnce();
  });
});
