import { and, eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db';
import {
  card_sets,
  cards,
  collection_logs,
  collection_printings,
  printings,
} from '@/lib/db/schema';
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
import { findOwnedQuantities, type ImportPlanEntry, ownedKey } from './buildImportPlan';
import { writeEntry } from './commitImport';
import { findStoredPrintings } from './findStoredPrintings';

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

let counter = 0;
const unique = () => `${Date.now()}-${++counter}`;

describe('CSV import database code', () => {
  let ids: DbFixtureIds;

  beforeEach(() => {
    ids = createFixtureTracker();
    scryfallGetCardById.mockReset();
    scryfallGetSetByCode.mockReset();
  });

  afterEach(async () => {
    await cleanupFixture(ids);
  });

  async function fixturePrinting(overrides: { language?: string; collectornumber?: string } = {}) {
    const code = `IM${unique()}`.toUpperCase();
    const set = await insertTestCardSet(ids, { name: 'Import Set', code, released: '2020-01-01' });
    const card = await insertTestCard(ids, `Import Card ${unique()}`);
    const printing = await insertTestPrinting(ids, {
      cardId: card.id,
      cardSetId: set.id,
      collectornumber: overrides.collectornumber ?? '12a',
      language: overrides.language,
      price: '1.00',
      foilprice: '2.00',
      scryfallId: `import-${unique()}`,
    });
    return { set, card, printing };
  }

  function entry(
    printing: { id: number | null; scryfall_id: string | null },
    overrides: Partial<ImportPlanEntry> = {},
  ): ImportPlanEntry {
    return {
      printing: {
        scryfallId: printing.scryfall_id ?? '',
        printingId: printing.id,
        card: null,
        name: 'Import Card',
        setCode: 'IM',
        collectorNumber: '12a',
        language: 'en',
        canAddNonfoil: true,
        canAddFoil: true,
        canAddEtched: true,
      },
      finish: 'nonfoil',
      lines: [2],
      quantityToAdd: 1,
      currentQuantity: 0,
      newQuantity: 1,
      ...overrides,
    };
  }

  describe('findStoredPrintings', () => {
    it('finds printings by Scryfall ID and by set, number and language', async () => {
      const { set, printing } = await fixturePrinting();
      const japanese = await insertTestPrinting(ids, {
        cardId: printing.card_id,
        cardSetId: set.id,
        collectornumber: '12a',
        language: 'ja',
        scryfallId: `import-${unique()}`,
      });

      const found = await findStoredPrintings([
        { key: `id:${printing.scryfall_id}`, scryfallId: printing.scryfall_id as string },
        {
          key: 'sn-en',
          set: set.code.toLowerCase(),
          collectorNumber: '12A',
          language: 'en',
        },
        { key: 'sn-ja', set: set.code.toLowerCase(), collectorNumber: '12a', language: 'ja' },
        { key: 'sn-missing', set: set.code.toLowerCase(), collectorNumber: '99', language: 'en' },
      ]);

      expect(found.get(`id:${printing.scryfall_id}`)?.printingId).toBe(printing.id);
      expect(found.get(`sn:${set.code.toLowerCase()}:12a:en`)?.printingId).toBe(printing.id);
      expect(found.get(`sn:${set.code.toLowerCase()}:12a:ja`)?.printingId).toBe(japanese.id);
      expect(found.get(`sn:${set.code.toLowerCase()}:99:en`)).toBeUndefined();
    });
  });

  describe('findOwnedQuantities', () => {
    it('returns the quantity for each finish and only for the user', async () => {
      const { printing } = await fixturePrinting();
      const user = await insertTestUser(ids);
      const other = await insertTestUser(ids);
      await insertTestCollectionPrinting(ids, {
        userId: user.id,
        printingId: printing.id,
        quantity: 2,
      });
      await insertTestCollectionPrinting(ids, {
        userId: user.id,
        printingId: printing.id,
        quantity: 4,
        foil: true,
      });
      await insertTestCollectionPrinting(ids, {
        userId: other.id,
        printingId: printing.id,
        quantity: 9,
      });

      const owned = await findOwnedQuantities(user.id, [printing.id]);

      expect(owned.get(ownedKey(printing.id, 'nonfoil'))).toBe(2);
      expect(owned.get(ownedKey(printing.id, 'foil'))).toBe(4);
      expect(owned.get(ownedKey(printing.id, 'etched'))).toBeUndefined();
    });
  });

  describe('writeEntry', () => {
    it('adds a new collection row and a log entry for a stored printing', async () => {
      const { printing } = await fixturePrinting();
      const user = await insertTestUser(ids);

      await writeEntry(user.id, entry(printing, { quantityToAdd: 3, finish: 'foil' }));

      const rows = await db
        .select()
        .from(collection_printings)
        .where(eq(collection_printings.user_id, user.id));
      const logs = await db
        .select()
        .from(collection_logs)
        .where(eq(collection_logs.user_id, user.id));

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ quantity: 3, foil: true, etched: false });
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({ change: 3, printing_id: printing.id });
      expect(scryfallGetCardById).not.toHaveBeenCalled();
    });

    it('adds to the quantity the user has now', async () => {
      const { printing } = await fixturePrinting();
      const user = await insertTestUser(ids);
      await insertTestCollectionPrinting(ids, {
        userId: user.id,
        printingId: printing.id,
        quantity: 2,
      });

      await writeEntry(user.id, entry(printing, { quantityToAdd: 3 }));
      await writeEntry(user.id, entry(printing, { quantityToAdd: 3 }));

      const [row] = await db
        .select()
        .from(collection_printings)
        .where(
          and(
            eq(collection_printings.user_id, user.id),
            eq(collection_printings.printing_id, printing.id),
          ),
        );
      expect(row.quantity).toBe(8);
    });

    it('saves a printing from Scryfall without a second Scryfall request for the card', async () => {
      const user = await insertTestUser(ids);
      const scryfallId = `import-${unique()}`;
      const setCode = `imn${counter}`;
      scryfallGetSetByCode.mockResolvedValue({
        object: 'set',
        code: setCode,
        name: 'New Import Set',
        icon_svg_uri: 'https://svgs.scryfall.io/sets/x.svg',
      });

      await writeEntry(
        user.id,
        entry(
          { id: null, scryfall_id: scryfallId },
          {
            quantityToAdd: 2,
            printing: {
              scryfallId,
              printingId: null,
              card: {
                id: scryfallId,
                name: `Fresh Card ${scryfallId}`,
                set: setCode,
                set_name: 'New Import Set',
                collector_number: '7',
                lang: 'en',
                released_at: '2021-01-01',
                rarity: 'rare',
                prices: { usd: '3.00', usd_foil: null, usd_etched: null },
              },
              name: 'Fresh Card',
              setCode: setCode.toUpperCase(),
              collectorNumber: '7',
              language: 'en',
              canAddNonfoil: true,
              canAddFoil: true,
              canAddEtched: true,
            },
          },
        ),
      );

      const [printing] = await db
        .select()
        .from(printings)
        .where(eq(printings.scryfall_id, scryfallId));
      const [set] = await db
        .select()
        .from(card_sets)
        .where(eq(card_sets.code, setCode.toUpperCase()));
      const [card] = await db
        .select()
        .from(cards)
        .where(eq(cards.name, `Fresh Card ${scryfallId}`));
      ids.printingIds.push(printing.id);
      ids.cardSetIds.push(set.id);
      ids.cardIds.push(card.id);

      const [row] = await db
        .select()
        .from(collection_printings)
        .where(eq(collection_printings.printing_id, printing.id));

      expect(scryfallGetCardById).not.toHaveBeenCalled();
      expect(row).toMatchObject({ user_id: user.id, quantity: 2 });
    });
  });
});
