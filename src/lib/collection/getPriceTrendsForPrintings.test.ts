import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  cleanupFixture,
  createFixtureTracker,
  insertTestCard,
  insertTestCardSet,
  insertTestPrinting,
} from '@/test/db-fixture';
import {
  getPriceTrendsForPrintings,
  type PriceTrendInput,
  priceTrendKey,
} from './getPriceTrendsForPrintings';
import { PRICE_TREND_DAYS } from './priceTrend';
import { upsertPrintingPriceHistory } from './printingPrices';

describe('getPriceTrendsForPrintings', () => {
  let ids = createFixtureTracker();

  beforeEach(() => {
    ids = createFixtureTracker();
  });

  afterEach(async () => {
    await cleanupFixture(ids);
  });

  async function insertHistory(
    printingId: number,
    rows: Array<{
      date: string;
      price: string | null;
      foilprice: string | null;
      etchedprice: string | null;
    }>,
  ) {
    for (const row of rows) {
      await upsertPrintingPriceHistory(
        printingId,
        { price: row.price, foilprice: row.foilprice, etchedprice: row.etchedprice },
        row.date,
      );
    }
  }

  it('computes non-foil trend change percent', async () => {
    const set = await insertTestCardSet(ids, {
      name: 'Set',
      code: `T-${Date.now()}`,
      released: '2020-01-01',
    });
    const card = await insertTestCard(ids, 'Card');
    const printing = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: '1',
      scryfallId: `sf-${Date.now()}-trend`,
    });

    await insertHistory(printing.id, [
      { date: '2026-01-01', price: '100', foilprice: null, etchedprice: null },
      { date: '2026-01-02', price: '110', foilprice: null, etchedprice: null },
    ]);

    const now = new Date('2026-01-03T00:00:00Z');

    const inputs: PriceTrendInput[] = [{ printingId: printing.id, foil: false, etched: false }];
    const trends = await getPriceTrendsForPrintings(inputs, { now });

    const key = priceTrendKey(inputs[0]);
    expect(trends[key]).toEqual({
      changePercent: 10,
      hasHistory: true,
      windowDays: PRICE_TREND_DAYS,
    });
  });

  it('computes foil trend for foil selection', async () => {
    const set = await insertTestCardSet(ids, {
      name: 'Set2',
      code: `T-${Date.now()}`,
      released: '2020-01-01',
    });
    const card = await insertTestCard(ids, 'Card2');
    const printing = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: '1',
      scryfallId: `sf-${Date.now()}-trend-foil`,
    });

    await insertHistory(printing.id, [
      { date: '2026-01-01', price: '100', foilprice: '200', etchedprice: null },
      { date: '2026-01-02', price: '120', foilprice: '180', etchedprice: null },
    ]);

    const now = new Date('2026-01-03T00:00:00Z');

    const inputs: PriceTrendInput[] = [{ printingId: printing.id, foil: true, etched: false }];
    const trends = await getPriceTrendsForPrintings(inputs, { now });

    const key = priceTrendKey(inputs[0]);
    // (180-200)/200*100 = -10
    expect(trends[key]?.changePercent).toBe(-10);
  });

  it('returns null changePercent when etched has insufficient non-null points', async () => {
    const set = await insertTestCardSet(ids, {
      name: 'Set3',
      code: `T-${Date.now()}`,
      released: '2020-01-01',
    });
    const card = await insertTestCard(ids, 'Card3');
    const printing = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: '1',
      scryfallId: `sf-${Date.now()}-trend-etched`,
    });

    await insertHistory(printing.id, [
      { date: '2026-01-01', price: '100', foilprice: null, etchedprice: null },
      { date: '2026-01-02', price: '101', foilprice: null, etchedprice: '50' },
    ]);

    const now = new Date('2026-01-03T00:00:00Z');

    const inputs: PriceTrendInput[] = [{ printingId: printing.id, foil: false, etched: true }];
    const trends = await getPriceTrendsForPrintings(inputs, { now });

    const key = priceTrendKey(inputs[0]);
    expect(trends[key]?.hasHistory).toBe(false);
    expect(trends[key]?.changePercent).toBeNull();
  });

  it('uses the cutoff window when computing the first/last points', async () => {
    const set = await insertTestCardSet(ids, {
      name: 'Set4',
      code: `T-${Date.now()}`,
      released: '2020-01-01',
    });
    const card = await insertTestCard(ids, 'Card4');
    const printing = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: '1',
      scryfallId: `sf-${Date.now()}-trend-cutoff`,
    });

    const now = new Date('2026-02-15T00:00:00Z');

    const oldDate = '2026-01-01';
    const inWindowDate = '2026-02-01';

    await insertHistory(printing.id, [
      { date: oldDate, price: '100', foilprice: null, etchedprice: null },
      { date: inWindowDate, price: '110', foilprice: null, etchedprice: null },
    ]);

    const inputs: PriceTrendInput[] = [{ printingId: printing.id, foil: false, etched: false }];
    const trends = await getPriceTrendsForPrintings(inputs, { now });

    // Only one point inside the window => insufficient history => null
    const key = priceTrendKey(inputs[0]);
    expect(trends[key]?.hasHistory).toBe(false);
    expect(trends[key]?.changePercent).toBeNull();
  });

  it('computes separate trends for the same printing with different finish flags', async () => {
    const set = await insertTestCardSet(ids, {
      name: 'Set5',
      code: `T-${Date.now()}`,
      released: '2020-01-01',
    });
    const card = await insertTestCard(ids, 'Card5');
    const printing = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: '1',
      scryfallId: `sf-${Date.now()}-trend-dupe`,
    });

    await insertHistory(printing.id, [
      { date: '2026-01-01', price: '100', foilprice: '200', etchedprice: null },
      { date: '2026-01-02', price: '110', foilprice: '180', etchedprice: null },
    ]);

    const now = new Date('2026-01-03T00:00:00Z');

    const inputs: PriceTrendInput[] = [
      { printingId: printing.id, foil: false, etched: false },
      { printingId: printing.id, foil: true, etched: false },
    ];

    const trends = await getPriceTrendsForPrintings(inputs, { now });
    const nonfoilKey = priceTrendKey(inputs[0]);
    const foilKey = priceTrendKey(inputs[1]);

    expect(trends[nonfoilKey]?.changePercent).toBe(10);
    expect(trends[foilKey]?.changePercent).toBe(-10);
  });
});
