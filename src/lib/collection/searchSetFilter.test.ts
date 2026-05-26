import { describe, expect, it } from 'vitest';
import { buildSetFilterOptions } from './searchSetFilter';
import type { CardSearchResult } from './types';

function result(overrides: Partial<CardSearchResult>): CardSearchResult {
  return {
    scryfallId: 'id-1',
    name: 'Card',
    setName: 'Set A',
    setCode: 'A',
    collectorNumber: '1',
    languageCode: 'en',
    imageUrl: null,
    priceUsd: null,
    priceUsdFoil: null,
    priceUsdEtched: null,
    tcgplayerProductId: null,
    canAddNonfoil: true,
    canAddFoil: true,
    canAddEtched: false,
    ...overrides,
  };
}

describe('buildSetFilterOptions', () => {
  it('returns unique sets sorted by label', () => {
    const options = buildSetFilterOptions([
      result({ setCode: 'DMR', setName: 'Dominaria Remastered', scryfallId: '1' }),
      result({ setCode: 'M10', setName: 'Magic 2010', scryfallId: '2' }),
      result({ setCode: 'DMR', setName: 'Dominaria Remastered', scryfallId: '3' }),
    ]);

    expect(options).toEqual([
      { value: 'DMR', label: 'Dominaria Remastered (DMR)' },
      { value: 'M10', label: 'Magic 2010 (M10)' },
    ]);
  });

  it('skips rows without a set code', () => {
    expect(buildSetFilterOptions([result({ setCode: '' })])).toEqual([]);
  });
});
