import cron from 'node-cron';
import { logger } from '@/lib/logger';
import { runSyncCollectionPricesJob, runUpdateExchangeRatesJob } from './jobs';

/** Same UTC schedule as the former `docker/crontab` sidecar. */
export const SYNC_PRICES_CRON = '0 3 * * *';
export const UPDATE_RATES_CRON = '0 14 * * *';

let started = false;

async function runScheduledJob(name: string, job: () => Promise<unknown>) {
  logger.info({ job: name }, 'Starting in-process cron job');
  try {
    const result = await job();
    logger.info({ job: name, result }, 'Completed in-process cron job');
  } catch (error) {
    logger.error({ job: name, err: error }, 'In-process cron job failed');
  }
}

/**
 * Registers UTC cron tasks inside the Node.js server process (production only; see
 * `src/instrumentation.ts`). Run a single app replica so schedules are not duplicated.
 */
export function startInProcessCron() {
  if (started) return;

  started = true;

  cron.schedule(
    SYNC_PRICES_CRON,
    () => {
      void runScheduledJob('sync-prices', runSyncCollectionPricesJob);
    },
    { timezone: 'UTC' },
  );

  cron.schedule(
    UPDATE_RATES_CRON,
    () => {
      void runScheduledJob('update-rates', runUpdateExchangeRatesJob);
    },
    { timezone: 'UTC' },
  );

  logger.info(
    { syncPrices: SYNC_PRICES_CRON, updateRates: UPDATE_RATES_CRON, timezone: 'UTC' },
    'In-process cron scheduler started',
  );
}
