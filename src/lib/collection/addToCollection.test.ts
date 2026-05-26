import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db';
import { card_sets, cards, collection_printings, printings } from '@/lib/db/schema';
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
import { addToCollection } from './addToCollection';

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

describe('addToCollection', () => {
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
      code: `LEA-${Date.now()}-add`,
      released: '1993-08-05',
    });
    const card = await insertTestCard(ids, 'Lightning Bolt');
    const printing = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: '161',
      scryfallId: `test-${Date.now()}-add`,
    });
    return { user, printing };
  }

  it('increments quantity for the same finish', async () => {
    const { user, printing } = await fixturePrinting();
    const existing = await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: printing.id,
      quantity: 2,
      foil: false,
    });

    if (!printing.scryfall_id) {
      throw new Error('Printing scryfall ID is null');
    }

    const result = await addToCollection({
      userId: user.id,
      scryfallId: printing.scryfall_id,
      quantity: 3,
      finish: 'nonfoil',
    });

    expect(result.collectionPrintingId).toBe(existing.id);

    const [row] = await db
      .select()
      .from(collection_printings)
      .where(eq(collection_printings.id, existing.id));
    expect(row?.quantity).toBe(5);
  });

  it('creates separate rows for different finishes', async () => {
    const { user, printing } = await fixturePrinting();
    const nonfoil = await insertTestCollectionPrinting(ids, {
      userId: user.id,
      printingId: printing.id,
      quantity: 1,
      foil: false,
    });

    if (!printing.scryfall_id) {
      throw new Error('Printing scryfall ID is null');
    }

    const result = await addToCollection({
      userId: user.id,
      scryfallId: printing.scryfall_id,
      quantity: 2,
      finish: 'foil',
    });

    expect(result.collectionPrintingId).not.toBe(nonfoil.id);

    const rows = await db
      .select()
      .from(collection_printings)
      .where(eq(collection_printings.user_id, user.id));

    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.foil)?.quantity).toBe(2);
    expect(rows.find((r) => !r.foil)?.quantity).toBe(1);
  });

  it('creates printing and set rows from Scryfall when missing', async () => {
    const user = await insertTestUser(ids);
    const scryfallId = `test-${Date.now()}-scryfall-new`;

    scryfallGetCardById.mockResolvedValue({
      id: scryfallId,
      name: 'Sol Ring',
      set: 'cmm',
      set_name: 'Commander Masters',
      released_at: '2023-08-04',
      collector_number: '401',
      lang: 'en',
      rarity: 'uncommon',
      multiverse_ids: [999],
      tcgplayer_id: 12345,
      prices: { usd: '1.25', usd_foil: '2.50', usd_etched: null },
    });
    scryfallGetSetByCode.mockResolvedValue({
      object: 'set',
      code: 'cmm',
      name: 'Commander Masters',
      icon_svg_uri: 'https://svgs.scryfall.io/sets/cmm.svg',
    });

    const result = await addToCollection({
      userId: user.id,
      scryfallId,
      quantity: 1,
      finish: 'nonfoil',
    });

    const [printing] = await db
      .select()
      .from(printings)
      .where(eq(printings.scryfall_id, scryfallId));
    const [set] = await db.select().from(card_sets).where(eq(card_sets.code, 'CMM'));
    const [card] = await db.select().from(cards).where(eq(cards.name, 'Sol Ring'));
    const [row] = await db
      .select()
      .from(collection_printings)
      .where(eq(collection_printings.id, result.collectionPrintingId));

    ids.printingIds.push(printing.id);
    ids.cardSetIds.push(set.id);
    ids.cardIds.push(card.id);

    expect(set.symbol_svg_uri).toBe('https://svgs.scryfall.io/sets/cmm.svg');
    expect(printing.collectornumber).toBe('401');
    expect(row?.quantity).toBe(1);
    expect(row?.foil).toBe(false);
  });
});
