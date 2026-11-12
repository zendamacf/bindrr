import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listCollectionScryfallIds } from '@/lib/collection/syncPrintingPrices';
import { db } from '@/lib/db';
import { printings, wishlist_cards } from '@/lib/db/schema';
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
import { addAnyPrintingToWishlist } from './addAnyPrintingToWishlist';
import { getWishlistAny } from './getWishlistAny';
import { getWishlistAnyPrintings } from './getWishlistAnyPrintings';
import { updateWishlistAny } from './updateWishlistAny';

const scryfallSearchPrints = vi.fn();
const scryfallGetCardById = vi.fn();
const defaultGetCardById = (id: string) =>
  Promise.resolve({
    prices: id.endsWith('-a') ? { usd: '5.00', usd_foil: '9.00' } : { usd: '1.50' },
  });

vi.mock('@/lib/scryfall/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/scryfall/client')>()),
  // Refreshing stale prices returns the fixture prices.
  scryfallGetCardById: (id: string) => scryfallGetCardById(id),
  scryfallSearchPrints: (...args: unknown[]) => scryfallSearchPrints(...args),
}));

describe('wishlist entries for any printing', () => {
  let ids: DbFixtureIds;

  beforeEach(() => {
    ids = createFixtureTracker();
    scryfallSearchPrints.mockReset();
    scryfallGetCardById.mockReset();
    scryfallGetCardById.mockImplementation(defaultGetCardById);
    scryfallSearchPrints.mockResolvedValue([]);
  });

  afterEach(async () => {
    await cleanupFixture(ids);
  });

  async function fixture() {
    const user = await insertTestUser(ids);
    const suffix = `${Date.now()}-any`;
    const set = await insertTestCardSet(ids, {
      name: 'Alpha',
      code: `LEA-${suffix}`,
      released: '1993-08-05',
    });
    const set2 = await insertTestCardSet(ids, {
      name: 'Beta',
      code: `LEB-${suffix}`,
      released: '1993-10-04',
    });
    const card = await insertTestCard(ids, 'Lightning Bolt');
    const expensive = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: '1',
      scryfallId: `test-${suffix}-a`,
      price: '5.00',
      foilprice: '9.00',
    });
    const cheap = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set2.id,
      collectornumber: '2',
      scryfallId: `test-${suffix}-b`,
      price: '1.50',
    });
    return { user, card, expensive, cheap };
  }

  it('adds an entry, merges duplicates and reports the cheapest printing', async () => {
    const { user, card, cheap } = await fixture();
    const params = {
      userId: user.id,
      scryfallId: cheap.scryfall_id as string,
      quantity: 1,
      finish: 'any' as const,
    };

    const first = await addAnyPrintingToWishlist(params);
    const second = await addAnyPrintingToWishlist({ ...params, quantity: 2 });
    expect(second.wishlistCardId).toBe(first.wishlistCardId);
    expect(second.quantity).toBe(3);
    expect(first.cardId).toBe(card.id);
    expect(scryfallSearchPrints).toHaveBeenCalledWith('!"Lightning Bolt"', { lang: 'en' });

    const result = await getWishlistAny({ userId: user.id });
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0]).toMatchObject({ name: 'Lightning Bolt', quantity: 3, owned: 0 });
    expect(result.cards[0].cheapest).toMatchObject({
      setCode: expect.stringContaining('LEB'),
      price: 1.5,
    });
    expect(result.totalPrice).toBe(4.5);
  });

  it('still adds the entry when Scryfall fails', async () => {
    const { user, cheap } = await fixture();
    scryfallSearchPrints.mockRejectedValue(new Error('down'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await addAnyPrintingToWishlist({
      userId: user.id,
      scryfallId: cheap.scryfall_id as string,
      quantity: 1,
      finish: 'any',
    });
    spy.mockRestore();
    expect(result.ok).toBe(true);
  });

  it('counts owned copies of any matching printing', async () => {
    const { user, expensive, cheap } = await fixture();
    await addAnyPrintingToWishlist({
      userId: user.id,
      scryfallId: cheap.scryfall_id as string,
      quantity: 3,
      finish: 'nonfoil',
    });
    await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: expensive.id,
      quantity: 2,
    });
    await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: cheap.id,
      quantity: 5,
      foil: true,
    });

    const [entry] = (await getWishlistAny({ userId: user.id })).cards;
    expect(entry.owned).toBe(2);
    expect(entry.missing).toBe(1);
  });

  it('includes all printings of wishlist cards in the price sync', async () => {
    const { user, expensive, cheap } = await fixture();
    await addAnyPrintingToWishlist({
      userId: user.id,
      scryfallId: cheap.scryfall_id as string,
      quantity: 1,
      finish: 'any',
    });
    const synced = await listCollectionScryfallIds();
    expect(synced).toEqual(expect.arrayContaining([expensive.scryfall_id, cheap.scryfall_id]));
  });

  it('updates, merges and removes entries', async () => {
    const { user, cheap } = await fixture();
    const base = {
      userId: user.id,
      scryfallId: cheap.scryfall_id as string,
      quantity: 1,
    };
    const any = await addAnyPrintingToWishlist({ ...base, finish: 'any' });
    const foil = await addAnyPrintingToWishlist({ ...base, finish: 'foil', quantity: 2 });

    expect(
      await updateWishlistAny({ userId: user.id, wishlistCardId: any.wishlistCardId, quantity: 4 }),
    ).toEqual({ ok: true, removed: false, wishlistCardId: any.wishlistCardId });

    const merged = await updateWishlistAny({
      userId: user.id,
      wishlistCardId: foil.wishlistCardId,
      finish: 'any',
    });
    expect(merged).toEqual({ ok: true, removed: false, wishlistCardId: any.wishlistCardId });
    const [row] = await db.select().from(wishlist_cards).where(eq(wishlist_cards.user_id, user.id));
    expect(row.quantity).toBe(6);

    expect(
      await updateWishlistAny({ userId: user.id, wishlistCardId: row.id, quantity: 0 }),
    ).toEqual({
      ok: true,
      removed: true,
    });
    expect(
      await updateWishlistAny({ userId: user.id, wishlistCardId: row.id, quantity: 1 }),
    ).toBeNull();
    await expect(updateWishlistAny({ userId: user.id, wishlistCardId: 1 })).rejects.toThrow(
      'Nothing to update',
    );
    await expect(
      updateWishlistAny({ userId: user.id, wishlistCardId: 1, quantity: -1 }),
    ).rejects.toThrow('Invalid quantity');
  });

  it('lists the printings that match the entry, cheapest first', async () => {
    const { user, expensive, cheap } = await fixture();
    const base = { userId: user.id, scryfallId: cheap.scryfall_id as string, quantity: 1 };
    const anyEntry = await addAnyPrintingToWishlist({ ...base, finish: 'any' });
    const foilEntry = await addAnyPrintingToWishlist({ ...base, finish: 'foil' });

    const all = await getWishlistAnyPrintings({
      userId: user.id,
      wishlistCardId: anyEntry.wishlistCardId,
    });
    expect(all?.printings.map((p) => p.scryfallId)).toEqual([
      cheap.scryfall_id,
      expensive.scryfall_id,
    ]);
    expect(all?.printings[1].finishes.map((f) => f.finish)).toEqual(['nonfoil', 'foil']);

    const foil = await getWishlistAnyPrintings({
      userId: user.id,
      wishlistCardId: foilEntry.wishlistCardId,
    });
    expect(foil?.printings.map((p) => p.scryfallId)).toEqual([expensive.scryfall_id]);
    expect(foil?.printings[0].finishes).toEqual([{ finish: 'foil', price: 9 }]);

    expect(
      await getWishlistAnyPrintings({
        userId: user.id + 1,
        wishlistCardId: anyEntry.wishlistCardId,
      }),
    ).toBeNull();
  });

  it('uses the prints from the search for prices and does not request each printing', async () => {
    const { user, expensive, cheap } = await fixture();
    const getCard = vi.fn();
    scryfallGetCardById.mockImplementation((id: string) => getCard(id));
    // The fixture printings have no price date, so they count as stale.
    scryfallSearchPrints.mockResolvedValue([
      { id: expensive.scryfall_id, prices: { usd: '4.00' } },
      { id: cheap.scryfall_id, prices: { usd: '1.25' } },
    ]);
    getCard.mockResolvedValue({ prices: { usd: '1.25' } });

    await addAnyPrintingToWishlist({
      userId: user.id,
      scryfallId: cheap.scryfall_id as string,
      quantity: 1,
      finish: 'any',
    });

    // One request for the printing that the user picked. None for the other printings.
    expect(getCard).toHaveBeenCalledTimes(1);
    const [row] = await db.select().from(printings).where(eq(printings.id, expensive.id));
    expect(row.price).toBe('4.00');
  });
});
