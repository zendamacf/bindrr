import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { wishlist_printings } from '@/lib/db/schema';
import {
  cleanupFixture,
  createFixtureTracker,
  type DbFixtureIds,
  insertTestCard,
  insertTestCardSet,
  insertTestPrinting,
  insertTestUser,
  insertTestWishlistPrinting,
} from '@/test/db-fixture';
import { updateWishlistItem } from './updateWishlistItem';

describe('updateWishlistItem', () => {
  let ids: DbFixtureIds;

  beforeEach(() => {
    ids = createFixtureTracker();
  });

  afterEach(async () => {
    await cleanupFixture(ids);
  });

  async function fixture(finish: 'any' | 'nonfoil' | 'foil' | 'etched' = 'any', quantity = 2) {
    const user = await insertTestUser(ids);
    const set = await insertTestCardSet(ids, {
      name: 'Alpha',
      code: `LEA-${Date.now()}-wlu`,
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

  async function rowsFor(userId: number) {
    return db.select().from(wishlist_printings).where(eq(wishlist_printings.user_id, userId));
  }

  it('throws when there is nothing to update', async () => {
    await expect(updateWishlistItem({ userId: 1, wishlistPrintingId: 1 })).rejects.toThrow(
      'Nothing to update',
    );
  });

  it('throws for a negative quantity', async () => {
    await expect(
      updateWishlistItem({ userId: 1, wishlistPrintingId: 1, quantity: -1 }),
    ).rejects.toThrow('Invalid quantity');
  });

  it('returns null for an item of a different user', async () => {
    const { item } = await fixture();
    const other = await insertTestUser(ids);

    const result = await updateWishlistItem({
      userId: other.id,
      wishlistPrintingId: item.id,
      quantity: 5,
    });

    expect(result).toBeNull();
  });

  it('changes the quantity', async () => {
    const { user, item } = await fixture();

    const result = await updateWishlistItem({
      userId: user.id,
      wishlistPrintingId: item.id,
      quantity: 4.7,
    });

    expect(result).toEqual({ ok: true, removed: false, wishlistPrintingId: item.id });
    expect((await rowsFor(user.id))[0].quantity).toBe(4);
  });

  it('removes the item when the quantity is 0', async () => {
    const { user, item } = await fixture();

    const result = await updateWishlistItem({
      userId: user.id,
      wishlistPrintingId: item.id,
      quantity: 0,
    });

    expect(result).toEqual({ ok: true, removed: true });
    expect(await rowsFor(user.id)).toHaveLength(0);
  });

  it('changes the finish', async () => {
    const { user, item } = await fixture('any', 2);

    const result = await updateWishlistItem({
      userId: user.id,
      wishlistPrintingId: item.id,
      finish: 'foil',
    });

    expect(result).toEqual({ ok: true, removed: false, wishlistPrintingId: item.id });
    expect(await rowsFor(user.id)).toMatchObject([{ finish: 'foil', quantity: 2 }]);
  });

  it('merges into the item that has the new finish', async () => {
    const { user, printing, item } = await fixture('any', 2);
    const foil = await insertTestWishlistPrinting(ids, {
      userId: user.id,
      printingId: printing.id,
      finish: 'foil',
      quantity: 3,
    });

    const result = await updateWishlistItem({
      userId: user.id,
      wishlistPrintingId: item.id,
      finish: 'foil',
      quantity: 1,
    });

    expect(result).toEqual({ ok: true, removed: false, wishlistPrintingId: foil.id });
    expect(await rowsFor(user.id)).toMatchObject([{ id: foil.id, finish: 'foil', quantity: 4 }]);
  });
});
