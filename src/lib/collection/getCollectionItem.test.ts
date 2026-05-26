import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { collection_logs } from '@/lib/db/schema';
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
import { getCollectionItem } from './getCollectionItem';

describe('getCollectionItem', () => {
  let ids: DbFixtureIds;

  beforeEach(() => {
    ids = createFixtureTracker();
  });

  afterEach(async () => {
    await cleanupFixture(ids);
  });

  it('returns card details and change history', async () => {
    const user = await insertTestUser(ids);
    const set = await insertTestCardSet(ids, {
      name: 'Alpha',
      code: `LEA-${Date.now()}`,
      released: '1993-08-05',
    });
    const card = await insertTestCard(ids, 'Lightning Bolt');
    const printing = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: '161',
      rarity: 'R',
      price: '1.00',
      foilprice: '12.50',
      scryfallId: `test-${Date.now()}-edit-item`,
    });
    const collectionPrinting = await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: printing.id,
      quantity: 2,
      foil: true,
    });

    await db.insert(collection_logs).values({
      user_id: user.id,
      printing_id: printing.id,
      foil: true,
      etched: false,
      change: 2,
    });

    const item = await getCollectionItem(user.id, collectionPrinting.id);

    expect(item).toMatchObject({
      name: 'Lightning Bolt',
      setName: 'Alpha',
      collectorNumber: '161',
      quantity: 2,
      foil: true,
      etched: false,
      price: 12.5,
    });
    expect(item?.history).toHaveLength(1);
    expect(item?.history[0]?.change).toBe(2);
  });

  it('returns null when the row belongs to another user', async () => {
    const owner = await insertTestUser(ids);
    const other = await insertTestUser(ids);
    const set = await insertTestCardSet(ids, {
      name: 'Beta',
      code: `LEB-${Date.now()}`,
      released: '1993-10-04',
    });
    const card = await insertTestCard(ids, 'Giant Growth');
    const printing = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: '1',
      scryfallId: `test-${Date.now()}-other-user`,
    });
    const collectionPrinting = await insertTestCollectionPrinting(ids, {
      userId: owner.id,
      printingId: printing.id,
      quantity: 1,
    });

    const item = await getCollectionItem(other.id, collectionPrinting.id);
    expect(item).toBeNull();
  });

  it('returns stored set symbol URL with code-based fallback', async () => {
    const user = await insertTestUser(ids);
    const set = await insertTestCardSet(ids, {
      name: 'Core Set 2019 Promos',
      code: 'PM19',
      released: '2018-07-13',
      symbolSvgUri: 'https://svgs.scryfall.io/sets/m19.svg',
    });
    const card = await insertTestCard(ids, 'Ravenous Chupacabra');
    const printing = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: '1',
      scryfallId: `test-${Date.now()}-symbol`,
    });
    const collectionPrinting = await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: printing.id,
      quantity: 1,
    });

    const item = await getCollectionItem(user.id, collectionPrinting.id);

    expect(item?.setSymbolUrl).toBe('https://svgs.scryfall.io/sets/m19.svg');
    expect(item?.canAddNonfoil).toBe(true);
  });
});
