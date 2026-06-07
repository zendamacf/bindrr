import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  SCRYFALL_COLLECTION_BATCH_SIZE,
  scryfallFetchCollection,
  scryfallFinishAvailability,
  scryfallGetSetByCode,
} from './client';

describe('scryfallFinishAvailability', () => {
  it('enables buttons based on finishes array', () => {
    expect(scryfallFinishAvailability(['nonfoil', 'foil'])).toEqual({
      canAddNonfoil: true,
      canAddFoil: true,
      canAddEtched: false,
    });
    expect(scryfallFinishAvailability(['nonfoil'])).toEqual({
      canAddNonfoil: true,
      canAddFoil: false,
      canAddEtched: false,
    });
    expect(scryfallFinishAvailability(['foil'])).toEqual({
      canAddNonfoil: false,
      canAddFoil: true,
      canAddEtched: false,
    });
    expect(scryfallFinishAvailability(['etched'])).toEqual({
      canAddNonfoil: false,
      canAddFoil: false,
      canAddEtched: true,
    });
  });

  it('allows all when finishes are missing', () => {
    expect(scryfallFinishAvailability(undefined)).toEqual({
      canAddNonfoil: true,
      canAddFoil: true,
      canAddEtched: true,
    });
  });
});

describe('scryfallFetchCollection', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts identifiers in batches of 75', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ object: 'list', data: [{ id: 'card-1' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ object: 'list', data: [{ id: 'card-2' }] }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const ids = Array.from({ length: SCRYFALL_COLLECTION_BATCH_SIZE + 1 }, (_, i) => `id-${i}`);
    const cards = await scryfallFetchCollection(ids, { delayMs: 0 });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(cards).toHaveLength(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.scryfall.com/cards/collection');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'POST' });
  });
});

describe('scryfallSearchPrints', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('includes lang in the Scryfall search query', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ object: 'list', data: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await import('./client').then(({ scryfallSearchPrints }) =>
      scryfallSearchPrints('lightning bolt', { lang: 'ja' }),
    );

    const url = new URL(fetchMock.mock.calls[0]?.[0] as string);
    expect(url.searchParams.get('q')).toBe('lightning bolt lang:ja');
  });
});

describe('scryfallGetSetByCode', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches set metadata by code', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        object: 'set',
        code: 'pm19',
        name: 'Core Set 2019 Promos',
        icon_svg_uri: 'https://svgs.scryfall.io/sets/m19.svg',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const set = await scryfallGetSetByCode(' PM19 ');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.scryfall.com/sets/pm19',
      expect.objectContaining({
        headers: expect.objectContaining({
          accept: 'application/json',
          'User-Agent': expect.stringContaining('Bindrr'),
        }),
      }),
    );
    expect(set.icon_svg_uri).toBe('https://svgs.scryfall.io/sets/m19.svg');
  });

  it('throws when Scryfall returns an error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ object: 'error', status: 404, code: 'not_found' }),
      }),
    );

    await expect(scryfallGetSetByCode('bad')).rejects.toThrow('Scryfall get set failed');
  });
});
