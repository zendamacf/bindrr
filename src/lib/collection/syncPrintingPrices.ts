import { eq, isNotNull } from 'drizzle-orm';
import { applyScryfallPricesToPrintings } from '@/lib/collection/printingPrices';
import { db } from '@/lib/db';
import { collection_printings, price_sync_state, printings } from '@/lib/db/schema';
import { logger } from '@/lib/logger';
import {
  SCRYFALL_COLLECTION_BATCH_SIZE,
  SCRYFALL_COLLECTION_MIN_INTERVAL_MS,
  scryfallFetchCollectionBatch,
} from '@/lib/scryfall/client';

export const COLLECTION_PRICE_SYNC_JOB = 'collection_prices';

/** Batches processed per cron invocation (75 cards each). Tune for Vercel timeout. */
export const PRICE_SYNC_MAX_BATCHES_PER_RUN = 30;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isSameUtcDate(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export async function listCollectionScryfallIds(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ scryfallId: printings.scryfall_id })
    .from(printings)
    .innerJoin(collection_printings, eq(collection_printings.printing_id, printings.id))
    .where(isNotNull(printings.scryfall_id));

  return rows.map((row) => row.scryfallId).filter((id): id is string => id != null);
}

type SyncStateRow = typeof price_sync_state.$inferSelect;

async function loadSyncState(): Promise<SyncStateRow | null> {
  const [row] = await db
    .select()
    .from(price_sync_state)
    .where(eq(price_sync_state.job, COLLECTION_PRICE_SYNC_JOB))
    .limit(1);
  return row ?? null;
}

async function clearSyncState() {
  await db.delete(price_sync_state).where(eq(price_sync_state.job, COLLECTION_PRICE_SYNC_JOB));
}

async function startSyncState(scryfallIds: string[]): Promise<SyncStateRow> {
  await clearSyncState();
  const now = new Date();
  const [row] = await db
    .insert(price_sync_state)
    .values({
      job: COLLECTION_PRICE_SYNC_JOB,
      scryfallIds,
      nextIndex: 0,
      updatedCount: 0,
      startedAt: now,
      updatedAt: now,
      completedAt: null,
    })
    .returning();
  return row;
}

async function saveSyncProgress(params: { nextIndex: number; updatedCount: number }) {
  await db
    .update(price_sync_state)
    .set({
      nextIndex: params.nextIndex,
      updatedCount: params.updatedCount,
      updatedAt: new Date(),
      completedAt: null,
    })
    .where(eq(price_sync_state.job, COLLECTION_PRICE_SYNC_JOB));
}

async function markSyncCompleted(params: { nextIndex: number; updatedCount: number }) {
  const now = new Date();
  await db
    .update(price_sync_state)
    .set({
      nextIndex: params.nextIndex,
      updatedCount: params.updatedCount,
      updatedAt: now,
      completedAt: now,
    })
    .where(eq(price_sync_state.job, COLLECTION_PRICE_SYNC_JOB));
}

export type SyncCollectionPrintingPricesResult = {
  updated: number;
  total: number;
  nextIndex: number;
  completed: boolean;
  resumed: boolean;
  /** True when today's full sync already finished and this run did no work. */
  skipped: boolean;
};

/**
 * Refreshes USD prices for in-collection printings, processing up to
 * `maxBatchesPerRun` Scryfall batches per call. Progress is persisted so the
 * next cron run can resume after a timeout. After a full pass completes, further
 * runs on the same UTC day are skipped until the next day.
 */
export async function syncCollectionPrintingPrices(options?: {
  maxBatchesPerRun?: number;
  now?: Date;
}): Promise<SyncCollectionPrintingPricesResult> {
  const maxBatchesPerRun = options?.maxBatchesPerRun ?? PRICE_SYNC_MAX_BATCHES_PER_RUN;
  const now = options?.now ?? new Date();

  let state = await loadSyncState();
  let resumed = false;

  if (state?.completedAt && isSameUtcDate(state.completedAt, now)) {
    logger.info("Skipping sync because it's the same UTC day as the previous completed sync");
    return {
      updated: 0,
      total: state.scryfallIds.length,
      nextIndex: state.nextIndex,
      completed: true,
      resumed: false,
      skipped: true,
    };
  }

  if (state?.completedAt) {
    logger.info("Clearing previous day's sync state");
    await clearSyncState();
    state = null;
  }

  if (state && !state.completedAt && state.nextIndex >= state.scryfallIds.length) {
    logger.info('Marking sync as completed because we previously processed all cards');
    await markSyncCompleted({
      nextIndex: state.nextIndex,
      updatedCount: state.updatedCount,
    });
    return {
      updated: 0,
      total: state.scryfallIds.length,
      nextIndex: state.nextIndex,
      completed: true,
      resumed: false,
      skipped: false,
    };
  }

  if (state && !state.completedAt) {
    logger.info("Resuming sync because we're not done");
    resumed = true;
  } else {
    const scryfallIds = (await listCollectionScryfallIds()).sort();
    if (scryfallIds.length === 0) {
      logger.info('No cards to sync');
      return {
        updated: 0,
        total: 0,
        nextIndex: 0,
        completed: true,
        resumed: false,
        skipped: false,
      };
    }
    logger.info('Starting new sync');
    state = await startSyncState(scryfallIds);
  }

  const ids = state.scryfallIds;
  logger.info(`Syncing ${ids.length} cards`);
  let nextIndex = state.nextIndex;
  let updatedCount = state.updatedCount;
  let updatedThisRun = 0;
  let batchesProcessed = 0;

  while (nextIndex < ids.length && batchesProcessed < maxBatchesPerRun) {
    if (batchesProcessed > 0) {
      await sleep(SCRYFALL_COLLECTION_MIN_INTERVAL_MS);
    }

    const chunk = ids.slice(nextIndex, nextIndex + SCRYFALL_COLLECTION_BATCH_SIZE);
    const cards = await scryfallFetchCollectionBatch(chunk);
    const batchUpdated = await applyScryfallPricesToPrintings(cards, now);

    nextIndex += chunk.length;
    updatedCount += batchUpdated;
    updatedThisRun += batchUpdated;
    batchesProcessed += 1;

    await saveSyncProgress({ nextIndex, updatedCount });
  }

  const completed = nextIndex >= ids.length;
  if (completed) {
    logger.info('Marking sync as completed because now processed all cards');
    await markSyncCompleted({ nextIndex, updatedCount });
  }

  return {
    updated: updatedThisRun,
    total: ids.length,
    nextIndex,
    completed,
    resumed,
    skipped: false,
  };
}
