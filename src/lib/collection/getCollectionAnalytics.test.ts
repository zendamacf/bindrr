import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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
  COLLECTION_ANALYTICS_DEFAULT_DAYS,
  getCollectionAnalytics,
  parseCollectionAnalyticsDaysParam,
} from './getCollectionAnalytics';
import { upsertPrintingPriceHistory } from './printingPrices';

describe('parseCollectionAnalyticsDaysParam', () => {
  it('parses positive integers', () => {
    expect(parseCollectionAnalyticsDaysParam('30')).toBe(30);
  });

  it('returns undefined for invalid values', () => {
    expect(parseCollectionAnalyticsDaysParam('0')).toBeUndefined();
    expect(parseCollectionAnalyticsDaysParam('nope')).toBeUndefined();
  });
});

describe('getCollectionAnalytics', () => {
  let ids: DbFixtureIds;

  beforeEach(() => {
    ids = createFixtureTracker();
  });

  afterEach(async () => {
    await cleanupFixture(ids);
  });

  it('returns totals, breakdowns, and value over time for the user collection', async () => {
    const user = await insertTestUser(ids);
    const setA = await insertTestCardSet(ids, {
      name: 'Alpha',
      code: `LEA-${Date.now()}`,
      released: '1993-08-05',
    });
    const setB = await insertTestCardSet(ids, {
      name: 'Beta',
      code: `LEB-${Date.now()}`,
      released: '1993-10-04',
    });
    const cardA = await insertTestCard(ids, 'Bolt');
    const cardB = await insertTestCard(ids, 'Birds');
    const printingA = await insertTestPrinting(ids, {
      cardId: cardA.id,
      cardSetId: setA.id,
      collectornumber: '1',
      rarity: 'R',
      price: '1.00',
      foilprice: '0',
      scryfallId: `analytics-a-${Date.now()}`,
    });
    const printingB = await insertTestPrinting(ids, {
      cardId: cardB.id,
      cardSetId: setB.id,
      collectornumber: '1',
      rarity: 'C',
      price: '0.50',
      foilprice: '2.00',
      scryfallId: `analytics-b-${Date.now()}`,
    });

    await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: printingA.id,
      quantity: 4,
      foil: false,
    });
    await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: printingB.id,
      quantity: 2,
      foil: true,
    });

    await upsertPrintingPriceHistory(
      printingA.id,
      { price: '1.00', foilprice: null, etchedprice: null },
      '2026-09-01',
    );
    await upsertPrintingPriceHistory(
      printingA.id,
      { price: '2.00', foilprice: null, etchedprice: null },
      '2026-09-02',
    );
    await upsertPrintingPriceHistory(
      printingB.id,
      { price: '0.50', foilprice: '2.00', etchedprice: null },
      '2026-09-02',
    );

    const now = new Date('2026-10-01T12:00:00.000Z');

    const result = await getCollectionAnalytics({
      userId: user.id,
      days: COLLECTION_ANALYTICS_DEFAULT_DAYS,
      now,
    });

    expect(result.currencyCode).toBe('USD');
    expect(result.totalCards).toBe(6);
    expect(result.totalValue).toBe(8);
    expect(result.windowDays).toBe(COLLECTION_ANALYTICS_DEFAULT_DAYS);

    expect(result.bySet).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Alpha', quantity: 4, value: 4 }),
        expect.objectContaining({ label: 'Beta', quantity: 2, value: 4 }),
      ]),
    );
    expect(result.byRarity).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Rare', quantity: 4, value: 4 }),
        expect.objectContaining({ label: 'Common', quantity: 2, value: 4 }),
      ]),
    );
    expect(result.byFinish).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Non-foil', quantity: 4, value: 4 }),
        expect.objectContaining({ label: 'Foil', quantity: 2, value: 4 }),
      ]),
    );

    expect(result.valueOverTime).toEqual([
      { date: '2026-09-01', value: 4 },
      { date: '2026-09-02', value: 12 },
    ]);
  });

  it('returns empty analytics for a user with no cards', async () => {
    const user = await insertTestUser(ids);

    const result = await getCollectionAnalytics({ userId: user.id });

    expect(result.totalCards).toBe(0);
    expect(result.totalValue).toBe(0);
    expect(result.valueOverTime).toEqual([]);
    expect(result.bySet).toEqual([]);
    expect(result.byRarity).toEqual([]);
    expect(result.byFinish).toEqual([]);
  });
});
