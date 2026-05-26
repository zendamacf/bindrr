import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { collection_printings } from '@/lib/db/schema';
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
import { getCollection } from './getCollection';
import { COLLECTION_PAGE_SIZE } from './helpers';

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
      language: 'jp',
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
    const fillerPrinting = await insertTestPrinting(ids, {
      cardId: fillerCard.id,
      cardSetId: set.id,
      collectornumber: '0',
      scryfallId: `test-${Date.now()}-filler`,
    });
    const fillerCollection = await db
      .insert(collection_printings)
      .values(
        Array.from({ length: COLLECTION_PAGE_SIZE }, () => ({
          user_id: user.id,
          printing_id: fillerPrinting.id,
          quantity: 1,
        })),
      )
      .returning({ id: collection_printings.id });
    ids.collectionPrintingIds.push(...fillerCollection.map((r) => r.id));

    const result = await getCollection({
      userId: user.id,
      page: 2,
      sort: 'name',
      sortDesc: 'asc',
    });

    expect(result.count).toBe(2);
    expect(result.total).toBe(COLLECTION_PAGE_SIZE + 4);
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
      language: 'JP',
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
});
