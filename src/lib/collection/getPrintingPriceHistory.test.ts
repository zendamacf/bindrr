import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { currencies } from '@/lib/db/schema';
import {
  cleanupFixture,
  createFixtureTracker,
  type DbFixtureIds,
  insertTestCard,
  insertTestCardSet,
  insertTestCollectionPrinting,
  insertTestPrinting,
  insertTestUser,
} from '@/test/db-fixture';
import {
  getCollectionItemPriceHistory,
  getPrintingPriceHistory,
  parsePriceHistoryDaysParam,
} from './getPrintingPriceHistory';
import { upsertPrintingPriceHistory } from './printingPrices';

describe('parsePriceHistoryDaysParam', () => {
  it('parses positive integers', () => {
    expect(parsePriceHistoryDaysParam('90')).toBe(90);
  });

  it('returns undefined for invalid values', () => {
    expect(parsePriceHistoryDaysParam(null)).toBeUndefined();
    expect(parsePriceHistoryDaysParam('')).toBeUndefined();
    expect(parsePriceHistoryDaysParam('abc')).toBeUndefined();
    expect(parsePriceHistoryDaysParam('0')).toBeUndefined();
    expect(parsePriceHistoryDaysParam('-5')).toBeUndefined();
  });
});

describe('getPrintingPriceHistory', () => {
  let ids: DbFixtureIds;

  beforeEach(() => {
    ids = createFixtureTracker();
  });

  afterEach(async () => {
    await cleanupFixture(ids);
  });

  it('returns converted points and series flags', async () => {
    const set = await insertTestCardSet(ids, {
      name: 'Test',
      code: `TST-${Date.now()}`,
      released: '2020-01-01',
    });
    const card = await insertTestCard(ids, 'Price History Card');
    const printing = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: '1',
      scryfallId: `test-${Date.now()}-history`,
    });

    await upsertPrintingPriceHistory(
      printing.id,
      { price: '1.00', foilprice: '2.00', etchedprice: null },
      '2026-01-01',
    );
    await upsertPrintingPriceHistory(
      printing.id,
      { price: '1.50', foilprice: null, etchedprice: '3.00' },
      '2026-01-02',
    );

    const result = await getPrintingPriceHistory(printing.id, 'USD');

    expect(result.currencyCode).toBe('USD');
    expect(result.points).toEqual([
      { date: '2026-01-01', nonfoil: 1, foil: 2, etched: null },
      { date: '2026-01-02', nonfoil: 1.5, foil: null, etched: 3 },
    ]);
    expect(result.series).toEqual({
      nonfoil: { hasData: true },
      foil: { hasData: true },
      etched: { hasData: true },
    });
  });

  it('converts USD amounts to the requested currency', async () => {
    const [existingEur] = await db
      .select({ id: currencies.id, exchangerate: currencies.exchangerate })
      .from(currencies)
      .where(eq(currencies.code, 'EUR'))
      .limit(1);

    const previousRate = existingEur?.exchangerate ?? null;
    if (existingEur) {
      await db
        .update(currencies)
        .set({ exchangerate: '2' })
        .where(eq(currencies.id, existingEur.id));
    } else {
      await db.insert(currencies).values({ code: 'EUR', exchangerate: '2' });
    }

    try {
      const set = await insertTestCardSet(ids, {
        name: 'EUR Set',
        code: `EUR-${Date.now()}`,
        released: '2020-01-01',
      });
      const card = await insertTestCard(ids, 'EUR Card');
      const printing = await insertTestPrinting(ids, {
        cardId: card.id,
        cardSetId: set.id,
        collectornumber: '1',
        scryfallId: `test-${Date.now()}-eur-history`,
      });

      await upsertPrintingPriceHistory(
        printing.id,
        { price: '1.00', foilprice: null, etchedprice: null },
        '2026-02-01',
      );

      const result = await getPrintingPriceHistory(printing.id, 'EUR');

      expect(result.currencyCode).toBe('EUR');
      expect(result.points[0]?.nonfoil).toBe(2);
    } finally {
      if (previousRate != null && existingEur) {
        await db
          .update(currencies)
          .set({ exchangerate: previousRate })
          .where(eq(currencies.id, existingEur.id));
      } else if (!existingEur) {
        await db.delete(currencies).where(eq(currencies.code, 'EUR'));
      }
    }
  });

  it('limits rows when days is set', async () => {
    const set = await insertTestCardSet(ids, {
      name: 'Days',
      code: `DAY-${Date.now()}`,
      released: '2020-01-01',
    });
    const card = await insertTestCard(ids, 'Days Card');
    const printing = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: '1',
      scryfallId: `test-${Date.now()}-days`,
    });

    const today = new Date();
    const recent = new Date(today);
    recent.setUTCDate(recent.getUTCDate() - 5);
    const old = new Date(today);
    old.setUTCDate(old.getUTCDate() - 40);

    await upsertPrintingPriceHistory(
      printing.id,
      { price: '1.00', foilprice: null, etchedprice: null },
      old.toISOString().slice(0, 10),
    );
    await upsertPrintingPriceHistory(
      printing.id,
      { price: '2.00', foilprice: null, etchedprice: null },
      recent.toISOString().slice(0, 10),
    );

    const result = await getPrintingPriceHistory(printing.id, 'USD', { days: 30 });

    expect(result.points).toHaveLength(1);
    expect(result.points[0]?.nonfoil).toBe(2);
  });

  it('returns empty points when no history exists', async () => {
    const set = await insertTestCardSet(ids, {
      name: 'Empty',
      code: `EMP-${Date.now()}`,
      released: '2020-01-01',
    });
    const card = await insertTestCard(ids, 'Empty Card');
    const printing = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: '1',
      scryfallId: `test-${Date.now()}-empty-history`,
    });

    const result = await getPrintingPriceHistory(printing.id, 'USD');

    expect(result.points).toEqual([]);
    expect(result.series).toEqual({
      nonfoil: { hasData: false },
      foil: { hasData: false },
      etched: { hasData: false },
    });
  });
});

describe('getCollectionItemPriceHistory', () => {
  let ids: DbFixtureIds;

  beforeEach(() => {
    ids = createFixtureTracker();
  });

  afterEach(async () => {
    await cleanupFixture(ids);
  });

  it('returns history for an owned collection row', async () => {
    const user = await insertTestUser(ids);
    const set = await insertTestCardSet(ids, {
      name: 'Owned',
      code: `OWN-${Date.now()}`,
      released: '2020-01-01',
    });
    const card = await insertTestCard(ids, 'Owned Card');
    const printing = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: '1',
      scryfallId: `test-${Date.now()}-owned-history`,
    });
    const collectionPrinting = await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: printing.id,
      quantity: 1,
    });

    await upsertPrintingPriceHistory(
      printing.id,
      { price: '0.50', foilprice: null, etchedprice: null },
      '2026-03-01',
    );

    const result = await getCollectionItemPriceHistory(user.id, collectionPrinting.id, 'USD');

    expect(result?.points).toEqual([
      { date: '2026-03-01', nonfoil: 0.5, foil: null, etched: null },
    ]);
  });

  it('returns null for another user or missing row', async () => {
    const owner = await insertTestUser(ids);
    const other = await insertTestUser(ids);
    const set = await insertTestCardSet(ids, {
      name: 'Other',
      code: `OTH-${Date.now()}`,
      released: '2020-01-01',
    });
    const card = await insertTestCard(ids, 'Other Card');
    const printing = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: '1',
      scryfallId: `test-${Date.now()}-other-history`,
    });
    const collectionPrinting = await insertTestCollectionPrinting(ids, {
      userId: owner.id,
      printingId: printing.id,
      quantity: 1,
    });

    await expect(
      getCollectionItemPriceHistory(other.id, collectionPrinting.id, 'USD'),
    ).resolves.toBeNull();
    await expect(getCollectionItemPriceHistory(owner.id, 999_999, 'USD')).resolves.toBeNull();
  });
});
