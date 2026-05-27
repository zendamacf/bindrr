import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearScryfallCardCache,
  getScryfallCardByIdCached,
  MAX_CACHED_SCRYFALL_CARDS,
  scryfallCardCacheSize,
} from './scryfallCard';

const scryfallGetCardById = vi.fn();

vi.mock('@/lib/scryfall/client', () => ({
  scryfallGetCardById: (...args: unknown[]) => scryfallGetCardById(...args),
}));

function card(id: string) {
  return { id, name: `Card ${id}` };
}

describe('getScryfallCardByIdCached', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearScryfallCardCache();
  });

  afterEach(() => {
    clearScryfallCardCache();
  });

  it('returns cached cards without refetching', async () => {
    scryfallGetCardById.mockResolvedValue(card('a'));

    await expect(getScryfallCardByIdCached('a')).resolves.toEqual(card('a'));
    await expect(getScryfallCardByIdCached('a')).resolves.toEqual(card('a'));

    expect(scryfallGetCardById).toHaveBeenCalledTimes(1);
  });

  it('evicts oldest entries when the cache exceeds the cap', async () => {
    scryfallGetCardById.mockImplementation(async (id: string) => card(id));

    for (let i = 0; i < MAX_CACHED_SCRYFALL_CARDS; i++) {
      await getScryfallCardByIdCached(`id-${i}`);
    }

    expect(scryfallCardCacheSize()).toBe(MAX_CACHED_SCRYFALL_CARDS);

    await getScryfallCardByIdCached('id-new');

    expect(scryfallCardCacheSize()).toBe(MAX_CACHED_SCRYFALL_CARDS);
    expect(scryfallGetCardById).toHaveBeenCalledTimes(MAX_CACHED_SCRYFALL_CARDS + 1);

    await getScryfallCardByIdCached('id-0');
    expect(scryfallGetCardById).toHaveBeenCalledTimes(MAX_CACHED_SCRYFALL_CARDS + 2);
  });
});
