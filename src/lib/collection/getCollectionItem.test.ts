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
import { updateCollectionItemQuantity } from './updateCollectionItem';

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
});

describe('updateCollectionItemQuantity', () => {
  let ids: DbFixtureIds;

  beforeEach(() => {
    ids = createFixtureTracker();
  });

  afterEach(async () => {
    await cleanupFixture(ids);
  });

  it('updates quantity and writes a log entry', async () => {
    const user = await insertTestUser(ids);
    const set = await insertTestCardSet(ids, {
      name: 'Alpha',
      code: `LEA-${Date.now()}-upd`,
      released: '1993-08-05',
    });
    const card = await insertTestCard(ids, 'Counterspell');
    const printing = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: '63',
      scryfallId: `test-${Date.now()}-upd`,
    });
    const collectionPrinting = await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: printing.id,
      quantity: 4,
    });

    const result = await updateCollectionItemQuantity({
      userId: user.id,
      collectionPrintingId: collectionPrinting.id,
      quantity: 2,
    });

    expect(result).toEqual({
      ok: true,
      removed: false,
      collectionPrintingId: collectionPrinting.id,
    });

    const item = await getCollectionItem(user.id, collectionPrinting.id);
    expect(item?.quantity).toBe(2);
    expect(item?.history.some((h) => h.change === -2)).toBe(true);
  });

  it('removes the row when quantity is set to zero', async () => {
    const user = await insertTestUser(ids);
    const set = await insertTestCardSet(ids, {
      name: 'Alpha',
      code: `LEA-${Date.now()}-rm`,
      released: '1993-08-05',
    });
    const card = await insertTestCard(ids, 'Island');
    const printing = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: '1',
      scryfallId: `test-${Date.now()}-rm`,
    });
    const collectionPrinting = await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: printing.id,
      quantity: 1,
    });

    const result = await updateCollectionItemQuantity({
      userId: user.id,
      collectionPrintingId: collectionPrinting.id,
      quantity: 0,
    });

    expect(result).toEqual({ ok: true, removed: true });
    const item = await getCollectionItem(user.id, collectionPrinting.id);
    expect(item).toBeNull();
  });
});
