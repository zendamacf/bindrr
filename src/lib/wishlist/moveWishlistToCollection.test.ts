import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db';
import { collection_logs, collection_printings, wishlist_printings } from '@/lib/db/schema';
import {
  cleanupFixture,
  createFixtureTracker,
  type DbFixtureIds,
  insertTestCard,
  insertTestCardSet,
  insertTestCollectionPrinting,
  insertTestPrinting,
  insertTestUser,
  insertTestWishlistPrinting,
} from '@/test/db-fixture';
import { InvalidMoveQuantityError, moveWishlistToCollection } from './moveWishlistToCollection';

const { failAfterCollectionWrite } = vi.hoisted(() => ({
  failAfterCollectionWrite: { enabled: false },
}));

// The wrapper runs the real collection write. Then it can fail, to test the rollback.
vi.mock('@/lib/collection/addPrintingToCollection', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/collection/addPrintingToCollection')>();
  return {
    addPrintingToCollection: async (...args: Parameters<typeof actual.addPrintingToCollection>) => {
      const result = await actual.addPrintingToCollection(...args);
      if (failAfterCollectionWrite.enabled) throw new Error('forced failure');
      return result;
    },
  };
});

describe('moveWishlistToCollection', () => {
  let ids: DbFixtureIds;

  beforeEach(() => {
    ids = createFixtureTracker();
    failAfterCollectionWrite.enabled = false;
  });

  afterEach(async () => {
    await cleanupFixture(ids);
  });

  async function fixture(finish: 'any' | 'nonfoil' | 'foil' | 'etched' = 'foil', quantity = 3) {
    const user = await insertTestUser(ids);
    const set = await insertTestCardSet(ids, {
      name: 'Alpha',
      code: `LEA-${Date.now()}-mv`,
      released: '1993-08-05',
    });
    const card = await insertTestCard(ids, 'Lightning Bolt');
    const printing = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: '161',
    });
    const item = await insertTestWishlistPrinting(ids, {
      userId: user.id,
      printingId: printing.id,
      finish,
      quantity,
    });
    return { user, printing, item };
  }

  const wishlistRows = (userId: number) =>
    db.select().from(wishlist_printings).where(eq(wishlist_printings.user_id, userId));
  const collectionRows = (userId: number) =>
    db.select().from(collection_printings).where(eq(collection_printings.user_id, userId));
  const logRows = (userId: number) =>
    db.select().from(collection_logs).where(eq(collection_logs.user_id, userId));

  it('moves all copies and removes the wishlist item', async () => {
    const { user, printing, item } = await fixture('foil', 3);

    const result = await moveWishlistToCollection({
      userId: user.id,
      wishlistPrintingId: item.id,
      finish: 'foil',
    });

    expect(result).toMatchObject({
      ok: true,
      printingId: printing.id,
      moved: 3,
      remaining: 0,
    });
    expect(await wishlistRows(user.id)).toHaveLength(0);
    expect(await collectionRows(user.id)).toMatchObject([
      { printing_id: printing.id, quantity: 3, foil: true, etched: false },
    ]);
    expect(await logRows(user.id)).toMatchObject([
      { printing_id: printing.id, change: 3, foil: true, etched: false },
    ]);
  });

  it('moves some copies and keeps the rest on the wishlist', async () => {
    const { user, item } = await fixture('nonfoil', 4);

    const result = await moveWishlistToCollection({
      userId: user.id,
      wishlistPrintingId: item.id,
      finish: 'nonfoil',
      quantity: 1,
    });

    expect(result).toMatchObject({ moved: 1, remaining: 3 });
    expect(await wishlistRows(user.id)).toMatchObject([{ id: item.id, quantity: 3 }]);
    expect(await collectionRows(user.id)).toMatchObject([{ quantity: 1 }]);
  });

  it('uses the finish that the user confirms, also when it differs from the item', async () => {
    const { user, item } = await fixture('any', 2);

    await moveWishlistToCollection({
      userId: user.id,
      wishlistPrintingId: item.id,
      finish: 'etched',
      quantity: 2,
    });

    expect(await collectionRows(user.id)).toMatchObject([
      { quantity: 2, foil: false, etched: true },
    ]);
    expect(await wishlistRows(user.id)).toHaveLength(0);
  });

  it('adds to an existing collection item with the same finish', async () => {
    const { user, printing, item } = await fixture('foil', 2);
    const owned = await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: printing.id,
      quantity: 5,
      foil: true,
    });

    const result = await moveWishlistToCollection({
      userId: user.id,
      wishlistPrintingId: item.id,
      finish: 'foil',
    });

    expect(result?.collectionPrintingId).toBe(owned.id);
    expect(await collectionRows(user.id)).toMatchObject([{ id: owned.id, quantity: 7 }]);
  });

  it('floors a fractional quantity', async () => {
    const { user, item } = await fixture('foil', 4);

    const result = await moveWishlistToCollection({
      userId: user.id,
      wishlistPrintingId: item.id,
      finish: 'foil',
      quantity: 2.9,
    });

    expect(result).toMatchObject({ moved: 2, remaining: 2 });
  });

  it('returns null for a missing item or an item of another user', async () => {
    const { item } = await fixture();
    const other = await insertTestUser(ids);

    expect(
      await moveWishlistToCollection({
        userId: other.id,
        wishlistPrintingId: item.id,
        finish: 'foil',
      }),
    ).toBeNull();
    expect(
      await moveWishlistToCollection({
        userId: other.id,
        wishlistPrintingId: 0,
        finish: 'foil',
      }),
    ).toBeNull();
    expect(await collectionRows(other.id)).toHaveLength(0);
  });

  it.each([0, 0.5, -1, Number.NaN])('rejects the quantity %s', async (quantity) => {
    const { user, item } = await fixture();

    await expect(
      moveWishlistToCollection({
        userId: user.id,
        wishlistPrintingId: item.id,
        finish: 'foil',
        quantity,
      }),
    ).rejects.toBeInstanceOf(InvalidMoveQuantityError);
    expect(await wishlistRows(user.id)).toMatchObject([{ quantity: 3 }]);
  });

  it('rejects a quantity above the wanted quantity and changes nothing', async () => {
    const { user, item } = await fixture('foil', 2);

    await expect(
      moveWishlistToCollection({
        userId: user.id,
        wishlistPrintingId: item.id,
        finish: 'foil',
        quantity: 3,
      }),
    ).rejects.toBeInstanceOf(InvalidMoveQuantityError);

    expect(await wishlistRows(user.id)).toMatchObject([{ quantity: 2 }]);
    expect(await collectionRows(user.id)).toHaveLength(0);
    expect(await logRows(user.id)).toHaveLength(0);
  });

  it('rolls back the collection write when the move fails', async () => {
    const { user, item } = await fixture('foil', 2);
    failAfterCollectionWrite.enabled = true;

    await expect(
      moveWishlistToCollection({
        userId: user.id,
        wishlistPrintingId: item.id,
        finish: 'foil',
      }),
    ).rejects.toThrow('forced failure');

    expect(await wishlistRows(user.id)).toMatchObject([{ quantity: 2 }]);
    expect(await collectionRows(user.id)).toHaveLength(0);
    expect(await logRows(user.id)).toHaveLength(0);
  });
});
