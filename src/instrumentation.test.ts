import { afterEach, describe, expect, it, vi } from 'vitest';

const startInProcessCron = vi.fn();

vi.mock('./lib/cron/scheduler', () => ({
  startInProcessCron,
}));

vi.mock('../sentry.server.config', () => ({}));
vi.mock('../sentry.edge.config', () => ({}));

describe('instrumentation register', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    startInProcessCron.mockClear();
  });

  it('does nothing in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const { register } = await import('./instrumentation');
    await register();
    expect(startInProcessCron).not.toHaveBeenCalled();
  });

  it('starts in-process cron on the Node.js runtime in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    const { register } = await import('./instrumentation');
    await register();
    expect(startInProcessCron).toHaveBeenCalledOnce();
  });

  it('does not start cron on the edge runtime', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    const { register } = await import('./instrumentation');
    await register();
    expect(startInProcessCron).not.toHaveBeenCalled();
  });
});
