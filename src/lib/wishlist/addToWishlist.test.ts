import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db';
import {
  card_sets,
  cards,
  collection_printings,
  printings,
  wishlist_printings,
} from '@/lib/db/schema';
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
import { addToWishlist } from './addToWishlist';

const scryfallGetCardById = vi.fn();
const scryfallGetSetByCode = vi.fn();

vi.mock('@/lib/scryfall/client', () => ({
  scryfallGetCardById: (...args: unknown[]) => scryfallGetCardById(...args),
  scryfallGetSetByCode: (...args: unknown[]) => scryfallGetSetByCode(...args),
  scryfallPrimaryFace: (card: { card_faces?: unknown[] }) => card.card_faces?.[0] ?? card,
  scryfallPricesFromCard: (card: {
    prices?: { usd?: string; usd_foil?: string; usd_etched?: string };
  }) => ({
    price: card.prices?.usd ?? null,
    foilprice: card.prices?.usd_foil ?? null,
    etchedprice: card.prices?.usd_etched ?? null,
  }),
}));

describe('addToWishlist', () => {
  let ids: DbFixtureIds;

  beforeEach(() => {
    ids = createFixtureTracker();
    scryfallGetCardById.mockReset();
    scryfallGetSetByCode.mockReset();
    scryfallGetCardById.mockResolvedValue({
      prices: { usd: '1.00', usd_foil: '2.00', usd_etched: null },
    });
  });

  afterEach(async () => {
    await cleanupFixture(ids);
  });

  async function fixturePrinting() {
    const user = await insertTestUser(ids);
    const set = await insertTestCardSet(ids, {
      name: 'Alpha',
      code: `LEA-${Date.now()}-wish`,
      released: '1993-08-05',
    });
    const card = await insertTestCard(ids, 'Lightning Bolt');
    const scryfallId = `test-${Date.now()}-wish`;
    const printing = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: '161',
      scryfallId,
    });
    return { user, printing, scryfallId };
  }

  it('adds a new item and does not change the collection', async () => {
    const { user, printing, scryfallId } = await fixturePrinting();

    const result = await addToWishlist({
      userId: user.id,
      scryfallId,
      quantity: 2,
      finish: 'any',
    });
    ids.wishlistPrintingIds.push(result.wishlistPrintingId);

    expect(result).toMatchObject({ ok: true, printingId: printing.id, quantity: 2 });

    const [row] = await db
      .select()
      .from(wishlist_printings)
      .where(eq(wishlist_printings.id, result.wishlistPrintingId));
    expect(row).toMatchObject({ user_id: user.id, finish: 'any', quantity: 2 });

    const owned = await db
      .select()
      .from(collection_printings)
      .where(eq(collection_printings.user_id, user.id));
    expect(owned).toHaveLength(0);
  });

  it('increases the quantity for the same finish', async () => {
    const { user, printing, scryfallId } = await fixturePrinting();
    const existing = await insertTestWishlistPrinting(ids, {
      userId: user.id,
      printingId: printing.id,
      quantity: 1,
      finish: 'foil',
    });

    const result = await addToWishlist({
      userId: user.id,
      scryfallId,
      quantity: 3,
      finish: 'foil',
    });

    expect(result.wishlistPrintingId).toBe(existing.id);
    expect(result.quantity).toBe(4);
  });

  it('keeps a separate item for each finish', async () => {
    const { user, printing, scryfallId } = await fixturePrinting();
    const anyFinish = await insertTestWishlistPrinting(ids, {
      userId: user.id,
      printingId: printing.id,
      finish: 'any',
    });

    const result = await addToWishlist({
      userId: user.id,
      scryfallId,
      quantity: 1,
      finish: 'etched',
    });
    ids.wishlistPrintingIds.push(result.wishlistPrintingId);

    expect(result.wishlistPrintingId).not.toBe(anyFinish.id);
    const rows = await db
      .select()
      .from(wishlist_printings)
      .where(eq(wishlist_printings.user_id, user.id));
    expect(rows.map((r) => r.finish).sort()).toEqual(['any', 'etched']);
  });

  it('uses a minimum quantity of 1', async () => {
    const { user, scryfallId } = await fixturePrinting();

    const result = await addToWishlist({
      userId: user.id,
      scryfallId,
      quantity: 0,
      finish: 'nonfoil',
    });
    ids.wishlistPrintingIds.push(result.wishlistPrintingId);

    expect(result.quantity).toBe(1);
  });

  it('creates the printing from Scryfall when it is missing', async () => {
    const user = await insertTestUser(ids);
    const scryfallId = `test-${Date.now()}-wish-new`;
    const setCode = `w${Date.now().toString(36)}`;

    scryfallGetCardById.mockResolvedValue({
      id: scryfallId,
      name: `Wish Card ${scryfallId}`,
      set: setCode,
      set_name: 'Wish Set',
      released_at: '2024-01-01',
      collector_number: '7',
      lang: 'en',
      rarity: 'rare',
      prices: { usd: '3.00', usd_foil: null, usd_etched: null },
    });
    scryfallGetSetByCode.mockResolvedValue({ object: 'set', code: setCode, name: 'Wish Set' });

    const result = await addToWishlist({
      userId: user.id,
      scryfallId,
      quantity: 1,
      finish: 'any',
    });
    ids.wishlistPrintingIds.push(result.wishlistPrintingId);

    const [printing] = await db
      .select()
      .from(printings)
      .where(eq(printings.scryfall_id, scryfallId));
    const [set] = await db
      .select()
      .from(card_sets)
      .where(eq(card_sets.code, setCode.toUpperCase()));
    const [card] = await db.select().from(cards).where(eq(cards.id, printing.card_id));
    ids.printingIds.push(printing.id);
    ids.cardSetIds.push(set.id);
    ids.cardIds.push(card.id);

    expect(result.printingId).toBe(printing.id);
    expect(printing.price).toBe('3.00');
  });
});
