import { afterEach, describe, expect, it, vi } from 'vitest';

const schedule = vi.fn();

vi.mock('node-cron', () => ({
  default: { schedule },
}));

describe('startInProcessCron', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    schedule.mockClear();
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
});
