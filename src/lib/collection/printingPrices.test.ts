import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScryfallCard } from '@/lib/scryfall/client';
import { toUtcDateString } from './printingPrices';

function scryfallCard(id: string, usd: string): ScryfallCard {
  return {
    id,
    name: 'Test Card',
    set: 'tst',
    set_name: 'Test Set',
    collector_number: '1',
    lang: 'en',
    prices: { usd },
  };
}

const dbInsert = vi.fn();
const dbUpdate = vi.fn();
const dbExecute = vi.fn();
const dbTransaction = vi.fn();

function mockPrintingLookup(rows: { id: number; scryfall_id: string }[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(rows),
  };
  return chain;
}

function mockTxSelect(rows: { id: number; scryfall_id: string }[]) {
  return {
    select: vi.fn().mockReturnValue(mockPrintingLookup(rows)),
    insert: dbInsert,
    execute: dbExecute,
  };
}

vi.mock('@/lib/db', () => ({
  db: {
    insert: (...args: unknown[]) => dbInsert(...args),
    update: (...args: unknown[]) => dbUpdate(...args),
    transaction: (...args: unknown[]) => dbTransaction(...args),
    execute: (...args: unknown[]) => dbExecute(...args),
  },
}));

describe('toUtcDateString', () => {
  it('returns the UTC calendar date', () => {
    expect(toUtcDateString(new Date('2026-05-26T23:59:00Z'))).toBe('2026-05-26');
  });
});

describe('upsertPrintingPriceHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('inserts with onConflictDoUpdate on printing and date', async () => {
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
    dbInsert.mockReturnValue({ values });

    const { upsertPrintingPriceHistory } = await import('./printingPrices');
    await upsertPrintingPriceHistory(
      9,
      { price: '1.00', foilprice: '2.00', etchedprice: null },
      '2026-05-26',
    );

    expect(values).toHaveBeenCalledWith({
      printingId: 9,
      recordedOn: '2026-05-26',
      price: '1.00',
      foilprice: '2.00',
      etchedprice: null,
    });
    expect(onConflictDoUpdate).toHaveBeenCalled();
  });
});

describe('applyPrintingPricesByScryfallId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('updates printings and records history', async () => {
    const returning = vi.fn().mockResolvedValue([{ id: 42 }]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    dbUpdate.mockReturnValue({ set });

    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
    dbInsert.mockReturnValue({ values });

    const { applyPrintingPricesByScryfallId } = await import('./printingPrices');
    const applied = await applyPrintingPricesByScryfallId(
      'scry-id',
      { price: '1.00', foilprice: null, etchedprice: null },
      new Date('2026-05-26T10:00:00Z'),
    );

    expect(applied).toBe(true);
    expect(dbUpdate).toHaveBeenCalled();
    expect(dbInsert).toHaveBeenCalled();
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ printingId: 42, recordedOn: '2026-05-26' }),
    );
  });
});

describe('applyScryfallPricesToPrintings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    dbExecute.mockResolvedValue(undefined);
    dbTransaction.mockImplementation(async (fn: (tx: ReturnType<typeof mockTxSelect>) => unknown) =>
      fn(mockTxSelect([])),
    );
  });

  it('returns zero for an empty card list', async () => {
    const { applyScryfallPricesToPrintings } = await import('./printingPrices');
    await expect(
      applyScryfallPricesToPrintings([], new Date('2026-05-26T10:00:00Z')),
    ).resolves.toBe(0);
    expect(dbTransaction).not.toHaveBeenCalled();
  });

  it('bulk-updates printings and history in one transaction', async () => {
    dbTransaction.mockImplementation(async (fn: (tx: ReturnType<typeof mockTxSelect>) => unknown) =>
      fn(
        mockTxSelect([
          { id: 1, scryfall_id: 'a' },
          { id: 2, scryfall_id: 'b' },
        ]),
      ),
    );

    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
    dbInsert.mockReturnValue({ values });

    const { applyScryfallPricesToPrintings } = await import('./printingPrices');
    const updated = await applyScryfallPricesToPrintings(
      [scryfallCard('a', '1.00'), scryfallCard('b', '2.00')],
      new Date('2026-05-26T10:00:00Z'),
    );

    expect(updated).toBe(2);
    expect(dbTransaction).toHaveBeenCalledTimes(1);
    expect(dbExecute).toHaveBeenCalledTimes(1);
    expect(dbUpdate).not.toHaveBeenCalled();
    expect(values).toHaveBeenCalledWith([
      {
        printingId: 1,
        recordedOn: '2026-05-26',
        price: '1.00',
        foilprice: null,
        etchedprice: null,
      },
      {
        printingId: 2,
        recordedOn: '2026-05-26',
        price: '2.00',
        foilprice: null,
        etchedprice: null,
      },
    ]);
    expect(onConflictDoUpdate).toHaveBeenCalled();
  });

  it('skips cards with no matching printing row', async () => {
    dbTransaction.mockImplementation(async (fn: (tx: ReturnType<typeof mockTxSelect>) => unknown) =>
      fn(mockTxSelect([{ id: 9, scryfall_id: 'known' }])),
    );

    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
    dbInsert.mockReturnValue({ values });

    const { applyScryfallPricesToPrintings } = await import('./printingPrices');
    const updated = await applyScryfallPricesToPrintings([
      scryfallCard('known', '1.00'),
      scryfallCard('missing', '9.00'),
    ]);

    expect(updated).toBe(1);
    expect(values).toHaveBeenCalledWith([
      expect.objectContaining({ printingId: 9, recordedOn: expect.any(String) }),
    ]);
  });
});
