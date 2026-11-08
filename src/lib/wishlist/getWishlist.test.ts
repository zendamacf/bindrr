import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
import { getWishlist } from './getWishlist';

/** A small page size makes pagination tests faster. Production uses 20. */
const { testPageSize } = vi.hoisted(() => ({ testPageSize: 2 }));

vi.mock('@/lib/collection/helpers', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/collection/helpers')>()),
  COLLECTION_PAGE_SIZE: testPageSize,
}));

describe('getWishlist', () => {
  let ids: DbFixtureIds;

  beforeEach(() => {
    ids = createFixtureTracker();
  });

  afterEach(async () => {
    await cleanupFixture(ids);
  });

  async function fixture() {
    const user = await insertTestUser(ids);
    const set = await insertTestCardSet(ids, {
      name: 'Alpha',
      code: `LEA-${Date.now()}-wl`,
      released: '1993-08-05',
    });
    const bolt = await insertTestCard(ids, 'Lightning Bolt');
    const ring = await insertTestCard(ids, 'Sol Ring');
    const boltPrinting = await insertTestPrinting(ids, {
      cardId: bolt.id,
      cardSetId: set.id,
      collectornumber: '161',
      rarity: 'C',
      language: 'ja',
      price: '2.00',
      foilprice: '10.00',
      etchedprice: '1.50',
      scryfallId: `test-${Date.now()}-wl-bolt`,
    });
    const ringPrinting = await insertTestPrinting(ids, {
      cardId: ring.id,
      cardSetId: set.id,
      collectornumber: '270',
      rarity: 'U',
      price: '5.00',
      scryfallId: `test-${Date.now()}-wl-ring`,
    });
    return { user, set, boltPrinting, ringPrinting };
  }

  it('returns mapped items and totals', async () => {
    const { user, set, boltPrinting, ringPrinting } = await fixture();
    const anyBolt = await insertTestWishlistPrinting(ids, {
      userId: user.id,
      printingId: boltPrinting.id,
      quantity: 2,
      finish: 'any',
    });
    await insertTestWishlistPrinting(ids, {
      userId: user.id,
      printingId: ringPrinting.id,
      quantity: 1,
      finish: 'foil',
    });

    const result = await getWishlist({ userId: user.id });

    expect(result.cards).toHaveLength(2);
    expect(result.cards[0]).toMatchObject({
      wishlistPrintingId: anyBolt.id,
      printingId: boltPrinting.id,
      name: 'Lightning Bolt',
      setCode: set.code,
      collectorNumber: '161',
      rarity: 'Common',
      quantity: 2,
      finish: 'any',
      price: 1.5,
      priceIsMinimum: true,
      currencyCode: 'USD',
      languageCode: 'ja',
    });
    expect(result.cards[0]).toMatchObject({
      canAddNonfoil: true,
      canAddFoil: true,
      canAddEtched: true,
    });
    expect(result.cards[0].addedAt).toEqual(anyBolt.created_at.toISOString());
    // The foil price of Sol Ring is not known.
    expect(result.cards[1]).toMatchObject({ finish: 'foil', price: null, priceIsMinimum: false });
    // Sol Ring has only a non-foil price, so the printing has only that finish.
    expect(result.cards[1]).toMatchObject({
      canAddNonfoil: true,
      canAddFoil: false,
      canAddEtched: false,
    });
    expect(result.total).toBe(3);
    expect(result.totalPrice).toBe(3);
    expect(result.count).toBe(1);
  });

  it('does not include owned cards or the items of other users', async () => {
    const { user, boltPrinting } = await fixture();
    const other = await insertTestUser(ids);
    await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: boltPrinting.id,
      quantity: 4,
    });
    await insertTestWishlistPrinting(ids, { userId: other.id, printingId: boltPrinting.id });

    const result = await getWishlist({ userId: user.id });

    expect(result.cards).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.count).toBe(0);
  });

  it('filters by name, rarity, set and finish', async () => {
    const { user, set, boltPrinting, ringPrinting } = await fixture();
    await insertTestWishlistPrinting(ids, {
      userId: user.id,
      printingId: boltPrinting.id,
      finish: 'nonfoil',
    });
    await insertTestWishlistPrinting(ids, {
      userId: user.id,
      printingId: ringPrinting.id,
      finish: 'any',
    });

    const byName = await getWishlist({ userId: user.id, filterSearch: ' ring ' });
    expect(byName.cards.map((c) => c.name)).toEqual(['Sol Ring']);

    const byRarity = await getWishlist({ userId: user.id, filterRarity: 'C' });
    expect(byRarity.cards.map((c) => c.name)).toEqual(['Lightning Bolt']);

    const byFinish = await getWishlist({ userId: user.id, filterFinish: 'any' });
    expect(byFinish.cards.map((c) => c.name)).toEqual(['Sol Ring']);

    const bySet = await getWishlist({ userId: user.id, filterSet: set.id });
    expect(bySet.cards).toHaveLength(2);
  });

  it('sorts and pages the items', async () => {
    const { user, boltPrinting, ringPrinting } = await fixture();
    await insertTestWishlistPrinting(ids, {
      userId: user.id,
      printingId: boltPrinting.id,
      finish: 'foil',
      quantity: 1,
      createdAt: new Date('2026-01-03T00:00:00Z'),
    });
    await insertTestWishlistPrinting(ids, {
      userId: user.id,
      printingId: boltPrinting.id,
      finish: 'any',
      quantity: 5,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    });
    await insertTestWishlistPrinting(ids, {
      userId: user.id,
      printingId: ringPrinting.id,
      finish: 'nonfoil',
      quantity: 3,
      createdAt: new Date('2026-01-02T00:00:00Z'),
    });

    const byPrice = await getWishlist({ userId: user.id, sort: 'price', sortDesc: 'desc' });
    expect(byPrice.cards.map((c) => c.price)).toEqual([10, 5]);
    expect(byPrice.count).toBe(2);

    const page2 = await getWishlist({ userId: user.id, sort: 'price', sortDesc: 'desc', page: 2 });
    expect(page2.cards.map((c) => c.price)).toEqual([1.5]);

    const byQuantity = await getWishlist({ userId: user.id, sort: 'quantity' });
    expect(byQuantity.cards.map((c) => c.quantity)).toEqual([1, 3]);

    const byFinish = await getWishlist({ userId: user.id, sort: 'finish' });
    expect(byFinish.cards.map((c) => c.finish)).toEqual(['any', 'nonfoil']);

    const byAdded = await getWishlist({ userId: user.id, sort: 'added', sortDesc: 'desc' });
    expect(byAdded.cards.map((c) => c.finish)).toEqual(['foil', 'nonfoil']);

    const byRarity = await getWishlist({ userId: user.id, sort: 'rarity', sortDesc: 'desc' });
    expect(byRarity.cards[0].name).toBe('Sol Ring');

    const byName = await getWishlist({ userId: user.id, sort: 'name', sortDesc: 'desc' });
    expect(byName.cards[0].name).toBe('Sol Ring');

    const bySet = await getWishlist({ userId: user.id, sort: 'setname' });
    expect(bySet.cards.map((c) => c.collectorNumber)).toEqual(['161', '161']);
  });
});
