import { afterEach, describe, expect, it, vi } from 'vitest';
import { scryfallFinishAvailability, scryfallGetSetByCode } from './client';

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
      expect.objectContaining({ headers: { accept: 'application/json' } }),
    );
    expect(set.icon_svg_uri).toBe('https://svgs.scryfall.io/sets/m19.svg');
  });

  it('throws when Scryfall returns an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    await expect(scryfallGetSetByCode('bad')).rejects.toThrow('Scryfall get set failed');
  });
});
