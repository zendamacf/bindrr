import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const schedule = vi.fn();
const runSyncCollectionPricesJob = vi.fn();
const runUpdateExchangeRatesJob = vi.fn();

vi.mock('node-cron', () => ({
  default: { schedule },
}));

vi.mock('./jobs', () => ({
  runSyncCollectionPricesJob,
  runUpdateExchangeRatesJob,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

function scheduleCallback(
  calls: ReturnType<typeof schedule.mock.calls>,
  expression: string,
): () => void | Promise<void> {
  const match = calls.find((call) => call[0] === expression);
  if (!match) throw new Error(`missing schedule for ${expression}`);
  return match[1] as () => void | Promise<void>;
}

describe('startInProcessCron', () => {
  beforeEach(() => {
    schedule.mockClear();
    runSyncCollectionPricesJob.mockReset();
    runUpdateExchangeRatesJob.mockReset();
    runSyncCollectionPricesJob.mockResolvedValue({ batches: 1 });
    runUpdateExchangeRatesJob.mockResolvedValue({ updated: 2 });
  });

  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('does not register tasks when IN_PROCESS_CRON is unset', async () => {
    const { startInProcessCron } = await import('./scheduler');
    startInProcessCron();
    expect(schedule).not.toHaveBeenCalled();
  });

  it('registers sync and rates jobs when IN_PROCESS_CRON=1', async () => {
    vi.stubEnv('IN_PROCESS_CRON', '1');
    const { startInProcessCron, SYNC_PRICES_CRON, UPDATE_RATES_CRON } = await import('./scheduler');
    startInProcessCron();
    expect(schedule).toHaveBeenCalledTimes(2);
    expect(schedule).toHaveBeenCalledWith(
      SYNC_PRICES_CRON,
      expect.any(Function),
      expect.objectContaining({ timezone: 'UTC' }),
    );
    expect(schedule).toHaveBeenCalledWith(
      UPDATE_RATES_CRON,
      expect.any(Function),
      expect.objectContaining({ timezone: 'UTC' }),
    );
  });

  it('registers schedules only once when called repeatedly', async () => {
    vi.stubEnv('IN_PROCESS_CRON', '1');
    const { startInProcessCron } = await import('./scheduler');
    startInProcessCron();
    startInProcessCron();
    expect(schedule).toHaveBeenCalledTimes(2);
  });

  it('runs sync job when the sync schedule fires', async () => {
    vi.stubEnv('IN_PROCESS_CRON', '1');
    const { startInProcessCron, SYNC_PRICES_CRON } = await import('./scheduler');
    startInProcessCron();

    await scheduleCallback(schedule.mock.calls, SYNC_PRICES_CRON)();

    expect(runSyncCollectionPricesJob).toHaveBeenCalledOnce();
  });

  it('runs update-rates job when the rates schedule fires', async () => {
    vi.stubEnv('IN_PROCESS_CRON', '1');
    const { startInProcessCron, UPDATE_RATES_CRON } = await import('./scheduler');
    startInProcessCron();

    await scheduleCallback(schedule.mock.calls, UPDATE_RATES_CRON)();

    expect(runUpdateExchangeRatesJob).toHaveBeenCalledOnce();
  });

  it('logs and swallows errors when a scheduled job fails', async () => {
    vi.stubEnv('IN_PROCESS_CRON', '1');
    runSyncCollectionPricesJob.mockRejectedValue(new Error('sync failed'));
    const { logger } = await import('@/lib/logger');
    const { startInProcessCron, SYNC_PRICES_CRON } = await import('./scheduler');
    startInProcessCron();

    scheduleCallback(schedule.mock.calls, SYNC_PRICES_CRON)();
    await vi.waitFor(() => {
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ job: 'sync-prices', err: expect.any(Error) }),
        'In-process cron job failed',
      );
    });
  });
});
