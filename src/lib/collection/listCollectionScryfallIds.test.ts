import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  cleanupFixture,
  createFixtureTracker,
  type DbFixtureIds,
  insertTestCard,
  insertTestCardSet,
  insertTestCollectionPrinting,
  insertTestPrintings,
  insertTestUser,
  insertTestWishlistPrinting,
} from '@/test/db-fixture';
import { listCollectionScryfallIds } from './syncPrintingPrices';

describe('listCollectionScryfallIds', () => {
  let ids: DbFixtureIds;

  beforeEach(() => {
    ids = createFixtureTracker();
  });

  afterEach(async () => {
    await cleanupFixture(ids);
  });

  it('includes owned and wishlist printings once, and excludes other printings', async () => {
    const user = await insertTestUser(ids);
    const set = await insertTestCardSet(ids, {
      name: 'Alpha',
      code: `LEA-${Date.now()}-sync`,
      released: '1993-08-05',
    });
    const card = await insertTestCard(ids, 'Lightning Bolt');
    const suffix = Date.now();
    const [owned, wanted, both, unused] = await insertTestPrintings(
      ids,
      ['owned', 'wanted', 'both', 'unused'].map((label, i) => ({
        cardId: card.id,
        cardSetId: set.id,
        collectornumber: String(i + 1),
        scryfallId: `test-${suffix}-sync-${label}`,
      })),
    );

    await insertTestCollectionPrinting(ids, { userId: user.id, printingId: owned.id, quantity: 1 });
    await insertTestCollectionPrinting(ids, { userId: user.id, printingId: both.id, quantity: 1 });
    await insertTestWishlistPrinting(ids, { userId: user.id, printingId: wanted.id });
    await insertTestWishlistPrinting(ids, { userId: user.id, printingId: both.id });

    const result = await listCollectionScryfallIds();
    const mine = result.filter((id) => id.startsWith(`test-${suffix}-sync-`));

    expect(mine.sort()).toEqual(
      [owned.scryfall_id, wanted.scryfall_id, both.scryfall_id].sort() as string[],
    );
    expect(result).not.toContain(unused.scryfall_id);
  });
});
