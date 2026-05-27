import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db';
import { card_sets } from '@/lib/db/schema';
import { cleanupFixture, createFixtureTracker, type DbFixtureIds } from '@/test/db-fixture';
import { ensureCardSet } from './ensureCardSet';

const { scryfallGetSetByCode, invalidateCardSetsCache } = vi.hoisted(() => ({
  scryfallGetSetByCode: vi.fn(),
  invalidateCardSetsCache: vi.fn(),
}));

vi.mock('@/lib/scryfall/client', () => ({
  scryfallGetSetByCode: (...args: unknown[]) => scryfallGetSetByCode(...args),
}));
vi.mock('@/lib/cache/invalidateCardSets', () => ({ invalidateCardSetsCache }));

describe('ensureCardSet', () => {
  let ids: DbFixtureIds;

  beforeEach(() => {
    ids = createFixtureTracker();
    scryfallGetSetByCode.mockReset();
    invalidateCardSetsCache.mockReset();
  });

  afterEach(async () => {
    await cleanupFixture(ids);
  });

  it('inserts a set with symbol_svg_uri from Scryfall', async () => {
    scryfallGetSetByCode.mockResolvedValue({
      object: 'set',
      code: 'pm19',
      name: 'Core Set 2019 Promos',
      icon_svg_uri: 'https://svgs.scryfall.io/sets/m19.svg',
    });

    const setId = await db.transaction((tx) =>
      ensureCardSet(tx, {
        code: 'PM19',
        name: 'Core Set 2019 Promos',
        released: '2018-07-13',
      }),
    );

    ids.cardSetIds.push(setId);

    const [row] = await db.select().from(card_sets).where(eq(card_sets.id, setId)).limit(1);

    expect(scryfallGetSetByCode).toHaveBeenCalledWith('pm19');
    expect(row).toMatchObject({
      code: 'PM19',
      symbol_svg_uri: 'https://svgs.scryfall.io/sets/m19.svg',
    });
    expect(invalidateCardSetsCache).toHaveBeenCalledTimes(1);
  });

  it('backfills symbol_svg_uri on an existing set row', async () => {
    const [existing] = await db
      .insert(card_sets)
      .values({
        code: 'SLD',
        name: 'Secret Lair Drop',
        released: '2020-01-01',
      })
      .returning({ id: card_sets.id });

    ids.cardSetIds.push(existing.id);

    scryfallGetSetByCode.mockResolvedValue({
      object: 'set',
      code: 'sld',
      name: 'Secret Lair Drop',
      icon_svg_uri: 'https://svgs.scryfall.io/sets/star.svg',
    });

    const setId = await db.transaction((tx) =>
      ensureCardSet(tx, {
        code: 'SLD',
        name: 'Secret Lair Drop',
        released: '2020-01-01',
      }),
    );

    expect(setId).toBe(existing.id);
    expect(scryfallGetSetByCode).toHaveBeenCalledWith('sld');

    const [row] = await db.select().from(card_sets).where(eq(card_sets.id, existing.id)).limit(1);

    expect(row?.symbol_svg_uri).toBe('https://svgs.scryfall.io/sets/star.svg');
    expect(invalidateCardSetsCache).not.toHaveBeenCalled();
  });

  it('does not call Scryfall when symbol_svg_uri is already stored', async () => {
    const [existing] = await db
      .insert(card_sets)
      .values({
        code: 'DMR',
        name: 'Dominaria Remastered',
        released: '2023-04-21',
        symbol_svg_uri: 'https://svgs.scryfall.io/sets/dmr.svg',
      })
      .returning({ id: card_sets.id });

    ids.cardSetIds.push(existing.id);

    const setId = await db.transaction((tx) =>
      ensureCardSet(tx, {
        code: 'DMR',
        name: 'Dominaria Remastered',
        released: '2023-04-21',
      }),
    );

    expect(setId).toBe(existing.id);
    expect(scryfallGetSetByCode).not.toHaveBeenCalled();
    expect(invalidateCardSetsCache).not.toHaveBeenCalled();
  });
});
