import { beforeEach, describe, expect, it, vi } from 'vitest';
import { COLLECTION_PRICE_SYNC_JOB, isSameUtcDate } from './syncPrintingPrices';

const dbSelect = vi.fn();
const dbInsert = vi.fn();
const dbUpdate = vi.fn();
const dbDelete = vi.fn();
const scryfallFetchCollectionBatch = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    select: (...args: unknown[]) => dbSelect(...args),
    selectDistinct: (...args: unknown[]) => dbSelect(...args),
    insert: (...args: unknown[]) => dbInsert(...args),
    update: (...args: unknown[]) => dbUpdate(...args),
    delete: (...args: unknown[]) => dbDelete(...args),
  },
}));

vi.mock('@/lib/scryfall/client', () => ({
  SCRYFALL_COLLECTION_BATCH_SIZE: 75,
  SCRYFALL_COLLECTION_MIN_INTERVAL_MS: 0,
  scryfallFetchCollectionBatch: (...args: unknown[]) => scryfallFetchCollectionBatch(...args),
  scryfallPricesFromCard: (card: {
    prices?: { usd?: string; usd_foil?: string; usd_etched?: string };
  }) => ({
    price: card.prices?.usd ?? null,
    foilprice: card.prices?.usd_foil ?? null,
    etchedprice: card.prices?.usd_etched ?? null,
  }),
}));

function mockDistinctChain(rows: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(rows),
  };
  return chain;
}

function mockSelectLimit(rows: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  };
  return chain;
}

function mockUpdateChain() {
  const where = vi.fn().mockResolvedValue(undefined);
  const set = vi.fn().mockReturnValue({ where });
  dbUpdate.mockReturnValue({ set });
  return { set, where };
}

function mockDeleteChain() {
  const where = vi.fn().mockResolvedValue(undefined);
  dbDelete.mockReturnValue({ where });
  return { where };
}

describe('isSameUtcDate', () => {
  it('matches dates on the same UTC calendar day', () => {
    expect(isSameUtcDate(new Date('2026-05-26T01:00:00Z'), new Date('2026-05-26T23:00:00Z'))).toBe(
      true,
    );
  });

  it('does not match adjacent UTC days', () => {
    expect(isSameUtcDate(new Date('2026-05-26T23:59:00Z'), new Date('2026-05-27T00:01:00Z'))).toBe(
      false,
    );
  });
});

describe('syncCollectionPrintingPrices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockDeleteChain();
  });

  it('returns zero when no collection printings have scryfall ids', async () => {
    dbSelect.mockReturnValueOnce(mockSelectLimit([])).mockReturnValueOnce(mockDistinctChain([]));

    const { syncCollectionPrintingPrices } = await import('./syncPrintingPrices');
    await expect(syncCollectionPrintingPrices()).resolves.toEqual({
      updated: 0,
      total: 0,
      nextIndex: 0,
      completed: true,
      resumed: false,
      skipped: false,
    });
    expect(scryfallFetchCollectionBatch).not.toHaveBeenCalled();
  });

  it('skips when a full sync already completed today', async () => {
    const completedAt = new Date('2026-05-26T12:00:00Z');
    dbSelect.mockReturnValueOnce(
      mockSelectLimit([
        {
          job: COLLECTION_PRICE_SYNC_JOB,
          scryfallIds: ['a', 'b'],
          nextIndex: 2,
          updatedCount: 2,
          startedAt: completedAt,
          updatedAt: completedAt,
          completedAt,
        },
      ]),
    );

    const { syncCollectionPrintingPrices } = await import('./syncPrintingPrices');
    await expect(
      syncCollectionPrintingPrices({ now: new Date('2026-05-26T18:00:00Z') }),
    ).resolves.toEqual({
      updated: 0,
      total: 2,
      nextIndex: 2,
      completed: true,
      resumed: false,
      skipped: true,
    });

    expect(scryfallFetchCollectionBatch).not.toHaveBeenCalled();
    expect(dbInsert).not.toHaveBeenCalled();
  });

  it('starts a new run on a new UTC day after a prior completion', async () => {
    const completedAt = new Date('2026-05-25T12:00:00Z');
    dbSelect
      .mockReturnValueOnce(
        mockSelectLimit([
          {
            job: COLLECTION_PRICE_SYNC_JOB,
            scryfallIds: ['old'],
            nextIndex: 1,
            updatedCount: 1,
            startedAt: completedAt,
            updatedAt: completedAt,
            completedAt,
          },
        ]),
      )
      .mockReturnValueOnce(mockDistinctChain([{ scryfallId: 'a' }]));

    dbInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            job: COLLECTION_PRICE_SYNC_JOB,
            scryfallIds: ['a'],
            nextIndex: 0,
            updatedCount: 0,
            startedAt: new Date(),
            updatedAt: new Date(),
            completedAt: null,
          },
        ]),
      }),
    });

    scryfallFetchCollectionBatch.mockResolvedValue([{ id: 'a', prices: { usd: '1.00' } }]);
    mockUpdateChain();

    const { syncCollectionPrintingPrices } = await import('./syncPrintingPrices');
    await expect(
      syncCollectionPrintingPrices({
        maxBatchesPerRun: 10,
        now: new Date('2026-05-26T08:00:00Z'),
      }),
    ).resolves.toEqual({
      updated: 1,
      total: 1,
      nextIndex: 1,
      completed: true,
      resumed: false,
      skipped: false,
    });

    expect(dbDelete).toHaveBeenCalled();
    expect(scryfallFetchCollectionBatch).toHaveBeenCalledWith(['a']);
  });

  it('starts a new run, persists progress per batch, and marks completed', async () => {
    dbSelect
      .mockReturnValueOnce(mockSelectLimit([]))
      .mockReturnValueOnce(mockDistinctChain([{ scryfallId: 'b' }, { scryfallId: 'a' }]));

    dbInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            job: COLLECTION_PRICE_SYNC_JOB,
            scryfallIds: ['a', 'b'],
            nextIndex: 0,
            updatedCount: 0,
            startedAt: new Date(),
            updatedAt: new Date(),
            completedAt: null,
          },
        ]),
      }),
    });

    scryfallFetchCollectionBatch.mockResolvedValue([
      { id: 'a', prices: { usd: '1.00' } },
      { id: 'b', prices: { usd: '2.00' } },
    ]);
    mockUpdateChain();

    const { syncCollectionPrintingPrices } = await import('./syncPrintingPrices');
    await expect(syncCollectionPrintingPrices({ maxBatchesPerRun: 10 })).resolves.toEqual({
      updated: 2,
      total: 2,
      nextIndex: 2,
      completed: true,
      resumed: false,
      skipped: false,
    });

    expect(scryfallFetchCollectionBatch).toHaveBeenCalledWith(['a', 'b']);
    expect(dbUpdate).toHaveBeenCalled();
  });

  it('resumes an in-progress run from the saved index', async () => {
    dbSelect.mockReturnValueOnce(
      mockSelectLimit([
        {
          job: COLLECTION_PRICE_SYNC_JOB,
          scryfallIds: ['a', 'b', 'c'],
          nextIndex: 2,
          updatedCount: 1,
          startedAt: new Date(),
          updatedAt: new Date(),
          completedAt: null,
        },
      ]),
    );

    scryfallFetchCollectionBatch.mockResolvedValue([{ id: 'c', prices: { usd: '3.00' } }]);
    mockUpdateChain();

    const { syncCollectionPrintingPrices } = await import('./syncPrintingPrices');
    await expect(syncCollectionPrintingPrices({ maxBatchesPerRun: 10 })).resolves.toEqual({
      updated: 1,
      total: 3,
      nextIndex: 3,
      completed: true,
      resumed: true,
      skipped: false,
    });

    expect(scryfallFetchCollectionBatch).toHaveBeenCalledWith(['c']);
    expect(dbInsert).not.toHaveBeenCalled();
  });

  it('stops after maxBatchesPerRun and leaves state for the next invocation', async () => {
    const manyIds = Array.from({ length: 150 }, (_, i) => `id-${i}`);
    dbSelect
      .mockReturnValueOnce(mockSelectLimit([]))
      .mockReturnValueOnce(mockDistinctChain(manyIds.map((id) => ({ scryfallId: id }))));

    dbInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            job: COLLECTION_PRICE_SYNC_JOB,
            scryfallIds: manyIds,
            nextIndex: 0,
            updatedCount: 0,
            startedAt: new Date(),
            updatedAt: new Date(),
            completedAt: null,
          },
        ]),
      }),
    });

    scryfallFetchCollectionBatch.mockResolvedValue([{ id: 'id-0', prices: { usd: '1.00' } }]);
    mockUpdateChain();

    const { syncCollectionPrintingPrices } = await import('./syncPrintingPrices');
    const result = await syncCollectionPrintingPrices({ maxBatchesPerRun: 1 });

    expect(result.completed).toBe(false);
    expect(result.resumed).toBe(false);
    expect(result.skipped).toBe(false);
    expect(result.nextIndex).toBe(75);
    expect(scryfallFetchCollectionBatch).toHaveBeenCalledTimes(1);
    expect(dbUpdate).toHaveBeenCalled();
    expect(dbInsert).toHaveBeenCalled();
  });
});
