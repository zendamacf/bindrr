import { describe, expect, it } from 'vitest';
import { scryfallCardUrl, tcgplayerProductUrl } from './printingLinks';

describe('printingLinks', () => {
  it('builds Scryfall card URLs', () => {
    expect(scryfallCardUrl('abc-123')).toBe('https://scryfall.com/card/abc-123');
  });

  it('builds TCGPlayer product URLs', () => {
    expect(tcgplayerProductUrl('12345')).toBe('https://www.tcgplayer.com/product/12345');
  });
});
