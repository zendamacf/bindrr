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
import { updateCollectionItem } from './updateCollectionItem';

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
});
