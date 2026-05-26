import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toUtcDateString } from './printingPrices';

const dbInsert = vi.fn();
const dbUpdate = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    insert: (...args: unknown[]) => dbInsert(...args),
    update: (...args: unknown[]) => dbUpdate(...args),
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
