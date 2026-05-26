import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanupFixture,
  createFixtureTracker,
  type DbFixtureIds,
  insertTestCard,
  insertTestCardSet,
  insertTestCollectionPrinting,
  insertTestCollectionPrintings,
  insertTestPrinting,
  insertTestPrintings,
  insertTestUser,
} from '@/test/db-fixture';
import { getCollection } from './getCollection';

/** Smaller page size in tests cuts pagination fixture inserts (prod uses 20). */
const { testCollectionPageSize } = vi.hoisted(() => ({
  testCollectionPageSize: 3,
}));

vi.mock('./helpers', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./helpers')>()),
  COLLECTION_PAGE_SIZE: testCollectionPageSize,
}));

describe('getCollection', () => {
  let ids: DbFixtureIds;

  beforeEach(() => {
    ids = createFixtureTracker();
  });

  afterEach(async () => {
    await cleanupFixture(ids);
  });

  it('returns paginated cards with mapped fields', async () => {
    const user = await insertTestUser(ids);
    const set = await insertTestCardSet(ids, {
      name: 'Alpha',
      code: `LEA-${Date.now()}`,
      released: '1993-08-05',
    });
    const card = await insertTestCard(ids, 'Lightning Bolt');
    const scryfallId = `8a84cb3f-5a0d-4c72-ba38-${Date.now().toString(16).padStart(12, '0')}`;
    const printing = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: '161',
      rarity: 'R',
      language: 'ja',
      price: '1.00',
      foilprice: '12.50',
      multiverseId: 123,
      scryfallId,
    });
    await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: printing.id,
      quantity: 4,
      foil: true,
    });

    const fillerCard = await insertTestCard(ids, 'Filler');
    const fillerBase = `test-${Date.now()}-filler`;
    const fillerPrintings = await insertTestPrintings(
      ids,
      Array.from({ length: testCollectionPageSize }, (_, i) => ({
        cardId: fillerCard.id,
        cardSetId: set.id,
        collectornumber: String(i),
        scryfallId: `${fillerBase}-${i}`,
      })),
    );
    await insertTestCollectionPrintings(
      ids,
      fillerPrintings.map((printing) => ({
        userId: user.id,
        printingId: printing.id,
        quantity: 1,
      })),
    );

    const result = await getCollection({
      userId: user.id,
      page: 2,
      sort: 'name',
      sortDesc: 'asc',
    });

    expect(result.count).toBe(2);
    expect(result.total).toBe(testCollectionPageSize + 4);
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0]).toMatchObject({
      name: 'Lightning Bolt',
      setName: 'Alpha',
      setCode: set.code,
      rarity: 'Rare',
      quantity: 4,
      foil: true,
      etched: false,
      price: 12.5,
      currencyCode: 'USD',
      languageCode: 'ja',
      language: 'Japanese',
      imageUrl: `https://cards.scryfall.io/normal/front/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.jpg`,
    });
  });

  it('returns empty results when the user has no cards', async () => {
    const user = await insertTestUser(ids);

    const result = await getCollection({ userId: user.id });

    expect(result.cards).toEqual([]);
    expect(result.count).toBe(0);
    expect(result.total).toBe(0);
    expect(result.totalPrice).toBe(0);
  });

  it('filters by card name', async () => {
    const user = await insertTestUser(ids);
    const set = await insertTestCardSet(ids, {
      name: 'Beta',
      code: `LEB-${Date.now()}`,
      released: '1993-10-04',
    });
    const bolt = await insertTestCard(ids, 'Lightning Bolt');
    const other = await insertTestCard(ids, 'Giant Growth');
    const boltPrinting = await insertTestPrinting(ids, {
      cardId: bolt.id,
      cardSetId: set.id,
      collectornumber: '1',
      scryfallId: `test-${Date.now()}-bolt-filter`,
    });
    const otherPrinting = await insertTestPrinting(ids, {
      cardId: other.id,
      cardSetId: set.id,
      collectornumber: '2',
      scryfallId: `test-${Date.now()}-growth-filter`,
    });
    await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: boltPrinting.id,
      quantity: 1,
    });
    await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: otherPrinting.id,
      quantity: 1,
    });

    const result = await getCollection({
      userId: user.id,
      filterSearch: 'bolt',
    });

    expect(result.cards).toHaveLength(1);
    expect(result.cards[0]?.name).toBe('Lightning Bolt');
  });

  it('filters by set and rarity', async () => {
    const user = await insertTestUser(ids);
    const setA = await insertTestCardSet(ids, {
      name: 'Alpha',
      code: `LEA-${Date.now()}-a`,
      released: '1993-08-05',
    });
    const setB = await insertTestCardSet(ids, {
      name: 'Beta',
      code: `LEB-${Date.now()}-b`,
      released: '1993-10-04',
    });
    const bolt = await insertTestCard(ids, 'Lightning Bolt');
    const island = await insertTestCard(ids, 'Island');
    const boltPrinting = await insertTestPrinting(ids, {
      cardId: bolt.id,
      cardSetId: setA.id,
      collectornumber: '1',
      rarity: 'R',
      scryfallId: `test-${Date.now()}-set-filter-bolt`,
    });
    const islandPrinting = await insertTestPrinting(ids, {
      cardId: island.id,
      cardSetId: setB.id,
      collectornumber: '2',
      rarity: 'C',
      scryfallId: `test-${Date.now()}-set-filter-island`,
    });
    await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: boltPrinting.id,
      quantity: 1,
    });
    await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: islandPrinting.id,
      quantity: 1,
    });

    const bySet = await getCollection({
      userId: user.id,
      filterSet: setA.id,
    });
    expect(bySet.cards).toHaveLength(1);
    expect(bySet.cards[0]?.name).toBe('Lightning Bolt');

    const byRarity = await getCollection({
      userId: user.id,
      filterRarity: 'C',
    });
    expect(byRarity.cards).toHaveLength(1);
    expect(byRarity.cards[0]?.name).toBe('Island');
  });

  it('sorts by set release date when sort is setname', async () => {
    const user = await insertTestUser(ids);
    const older = await insertTestCardSet(ids, {
      name: 'Alpha',
      code: `LEA-${Date.now()}-sort`,
      released: '1993-08-05',
    });
    const newer = await insertTestCardSet(ids, {
      name: 'Beta',
      code: `LEB-${Date.now()}-sort`,
      released: '1993-10-04',
    });
    const oldCard = await insertTestCard(ids, 'Old Card');
    const newCard = await insertTestCard(ids, 'New Card');
    const oldPrinting = await insertTestPrinting(ids, {
      cardId: oldCard.id,
      cardSetId: older.id,
      collectornumber: '1',
      scryfallId: `test-${Date.now()}-old`,
    });
    const newPrinting = await insertTestPrinting(ids, {
      cardId: newCard.id,
      cardSetId: newer.id,
      collectornumber: '1',
      scryfallId: `test-${Date.now()}-new`,
    });
    await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: newPrinting.id,
      quantity: 1,
    });
    await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: oldPrinting.id,
      quantity: 1,
    });

    const result = await getCollection({
      userId: user.id,
      sort: 'setname',
      sortDesc: 'asc',
    });

    expect(result.cards.map((c) => c.name)).toEqual(['Old Card', 'New Card']);
  });
});
