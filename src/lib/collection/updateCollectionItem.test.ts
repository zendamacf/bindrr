import { eq } from 'drizzle-orm';
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
import { getCollectionItem } from './getCollectionItem';
import { updateCollectionItem, updateCollectionItemQuantity } from './updateCollectionItem';

describe('updateCollectionItem', () => {
  let ids: DbFixtureIds;

  beforeEach(() => {
    ids = createFixtureTracker();
  });

  afterEach(async () => {
    await cleanupFixture(ids);
  });

  it('merges quantities when changing finish onto an existing row', async () => {
    const user = await insertTestUser(ids);
    const set = await insertTestCardSet(ids, {
      name: 'Alpha',
      code: `LEA-${Date.now()}-merge`,
      released: '1993-08-05',
    });
    const card = await insertTestCard(ids, 'Lightning Bolt');
    const printing = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: '161',
      scryfallId: `test-${Date.now()}-merge`,
    });

    const nonfoil = await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: printing.id,
      quantity: 3,
      foil: false,
    });
    const foil = await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: printing.id,
      quantity: 2,
      foil: true,
    });

    const result = await updateCollectionItem({
      userId: user.id,
      collectionPrintingId: foil.id,
      quantity: 2,
      finish: 'nonfoil',
    });

    expect(result).toEqual({
      ok: true,
      removed: false,
      collectionPrintingId: nonfoil.id,
    });

    const merged = await getCollectionItem(user.id, nonfoil.id);
    expect(merged?.quantity).toBe(5);

    const foilRows = await db
      .select()
      .from(collection_printings)
      .where(eq(collection_printings.id, foil.id));
    expect(foilRows).toHaveLength(0);
  });

  it('merges when only finish is patched (quantity matches source row)', async () => {
    const user = await insertTestUser(ids);
    const set = await insertTestCardSet(ids, {
      name: 'Alpha',
      code: `LEA-${Date.now()}-finish-only`,
      released: '1993-08-05',
    });
    const card = await insertTestCard(ids, 'Giant Growth');
    const printing = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: '162',
      scryfallId: `test-${Date.now()}-finish-only`,
    });

    const nonfoil = await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: printing.id,
      quantity: 1,
      foil: false,
    });
    const foil = await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: printing.id,
      quantity: 4,
      foil: true,
    });

    const result = await updateCollectionItem({
      userId: user.id,
      collectionPrintingId: foil.id,
      quantity: 4,
      finish: 'nonfoil',
    });

    expect(result?.collectionPrintingId).toBe(nonfoil.id);

    const merged = await getCollectionItem(user.id, nonfoil.id);
    expect(merged?.quantity).toBe(5);
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

    const result = await updateCollectionItem({
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

    const result = await updateCollectionItem({
      userId: user.id,
      collectionPrintingId: collectionPrinting.id,
      quantity: 0,
    });

    expect(result).toEqual({ ok: true, removed: true });
    expect(await getCollectionItem(user.id, collectionPrinting.id)).toBeNull();
  });

  it('changes finish in place when no row exists for the target finish', async () => {
    const user = await insertTestUser(ids);
    const set = await insertTestCardSet(ids, {
      name: 'Alpha',
      code: `LEA-${Date.now()}-in-place`,
      released: '1993-08-05',
    });
    const card = await insertTestCard(ids, 'Shock');
    const printing = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: '99',
      scryfallId: `test-${Date.now()}-in-place`,
      foilprice: '5.00',
    });
    const row = await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: printing.id,
      quantity: 2,
      foil: false,
    });

    const result = await updateCollectionItem({
      userId: user.id,
      collectionPrintingId: row.id,
      quantity: 2,
      finish: 'foil',
    });

    expect(result).toMatchObject({
      ok: true,
      removed: false,
      collectionPrintingId: row.id,
    });

    const item = await getCollectionItem(user.id, row.id);
    expect(item).toMatchObject({ foil: true, etched: false, quantity: 2, price: 5 });
  });

  it('drops the source row when changing finish with zero quantity but keeps the target', async () => {
    const user = await insertTestUser(ids);
    const set = await insertTestCardSet(ids, {
      name: 'Alpha',
      code: `LEA-${Date.now()}-zero-finish`,
      released: '1993-08-05',
    });
    const card = await insertTestCard(ids, 'Dark Ritual');
    const printing = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: '1',
      scryfallId: `test-${Date.now()}-zero-finish`,
    });
    const nonfoil = await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: printing.id,
      quantity: 4,
      foil: false,
    });
    const foil = await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: printing.id,
      quantity: 1,
      foil: true,
    });

    const result = await updateCollectionItem({
      userId: user.id,
      collectionPrintingId: foil.id,
      quantity: 0,
      finish: 'nonfoil',
    });

    expect(result).toMatchObject({
      ok: true,
      removed: false,
      collectionPrintingId: nonfoil.id,
    });

    const foilRows = await db
      .select()
      .from(collection_printings)
      .where(eq(collection_printings.id, foil.id));
    expect(foilRows).toHaveLength(0);

    const item = await getCollectionItem(user.id, nonfoil.id);
    expect(item?.quantity).toBe(4);
  });

  it('updateCollectionItemQuantity delegates to updateCollectionItem', async () => {
    const user = await insertTestUser(ids);
    const set = await insertTestCardSet(ids, {
      name: 'Alpha',
      code: `LEA-${Date.now()}-delegate`,
      released: '1993-08-05',
    });
    const card = await insertTestCard(ids, 'Grizzly Bears');
    const printing = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: '1',
      scryfallId: `test-${Date.now()}-delegate`,
    });
    const row = await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: printing.id,
      quantity: 3,
    });

    await updateCollectionItemQuantity({
      userId: user.id,
      collectionPrintingId: row.id,
      quantity: 1,
    });

    const item = await getCollectionItem(user.id, row.id);
    expect(item?.quantity).toBe(1);
  });
});
