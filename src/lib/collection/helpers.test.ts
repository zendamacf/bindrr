import { describe, expect, it } from 'vitest';
import {
  COLLECTION_PAGE_SIZE,
  clampPage,
  formatLanguage,
  pageCount,
  paginateSlice,
  printingImageUrl,
  rarityLabel,
  resolveSetSymbolUrl,
  setSymbolImageUrl,
  unitPrice,
} from './helpers';

describe('collection helpers', () => {
  describe('pageCount', () => {
    it('returns 0 when there are no rows', () => {
      expect(pageCount(0, COLLECTION_PAGE_SIZE)).toBe(0);
    });

    it('returns 1 for a partial last page', () => {
      expect(pageCount(5, COLLECTION_PAGE_SIZE)).toBe(1);
    });

    it('returns 2 when rows exceed one page', () => {
      expect(pageCount(21, COLLECTION_PAGE_SIZE)).toBe(2);
    });
  });

  describe('paginateSlice', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];

    it('returns the first page', () => {
      expect(paginateSlice(items, 1, 2)).toEqual(['a', 'b']);
    });

    it('returns a middle page', () => {
      expect(paginateSlice(items, 2, 2)).toEqual(['c', 'd']);
    });

    it('returns a partial last page', () => {
      expect(paginateSlice(items, 3, 2)).toEqual(['e']);
    });

    it('returns empty when page is beyond the range', () => {
      expect(paginateSlice(items, 4, 2)).toEqual([]);
    });
  });

  describe('clampPage', () => {
    it('returns page when within range', () => {
      expect(clampPage(2, 3)).toBe(2);
    });

    it('clamps to the last page when page exceeds total', () => {
      expect(clampPage(5, 3)).toBe(3);
    });

    it('leaves page unchanged when there are no pages', () => {
      expect(clampPage(2, 0)).toBe(2);
    });
  });

  describe('rarityLabel', () => {
    it('maps single-letter rarity codes', () => {
      expect(rarityLabel('M')).toBe('Mythic');
      expect(rarityLabel('C')).toBe('Common');
    });

    it('returns null for missing rarity', () => {
      expect(rarityLabel(null)).toBeNull();
    });
  });

  describe('unitPrice', () => {
    it('uses foil price when foil is true', () => {
      expect(unitPrice(true, false, '1.00', '5.00', '8.00')).toBe(5);
    });

    it('uses etched price when etched is true', () => {
      expect(unitPrice(false, true, '1.00', '5.00', '8.00')).toBe(8);
    });

    it('uses normal price when non-foil', () => {
      expect(unitPrice(false, false, '1.00', '5.00', '8.00')).toBe(1);
    });

    it('returns null when the relevant price is missing', () => {
      expect(unitPrice(false, false, null, '5.00', '8.00')).toBeNull();
    });
  });

  describe('printingImageUrl', () => {
    it('builds a Scryfall image URL from scryfall id', () => {
      const id = '8a84cb3f-5a0d-4c72-ba38-3abbe1ca62f4';
      expect(printingImageUrl(id)).toBe(
        `https://cards.scryfall.io/normal/front/${id[0]}/${id[1]}/${id}.jpg`,
      );
    });

    it('returns null without scryfall id', () => {
      expect(printingImageUrl(null)).toBeNull();
    });
  });

  describe('resolveSetSymbolUrl', () => {
    it('prefers the stored Scryfall icon URI', () => {
      expect(resolveSetSymbolUrl('https://svgs.scryfall.io/sets/m19.svg', 'PM19')).toBe(
        'https://svgs.scryfall.io/sets/m19.svg',
      );
    });

    it('falls back to code-based URL when stored URI is missing', () => {
      expect(resolveSetSymbolUrl(null, 'DMR')).toBe('https://svgs.scryfall.io/sets/dmr.svg');
    });
  });

  describe('setSymbolImageUrl', () => {
    it('builds a Scryfall set symbol URL from set code', () => {
      expect(setSymbolImageUrl('DMR')).toBe('https://svgs.scryfall.io/sets/dmr.svg');
    });

    it('returns null without set code', () => {
      expect(setSymbolImageUrl(null)).toBeNull();
    });
  });

  describe('formatLanguage', () => {
    it('returns a readable label for known languages', () => {
      expect(formatLanguage('ja')).toBe('Japanese');
      expect(formatLanguage('en')).toBe('English');
      expect(formatLanguage(null)).toBe('English');
    });

    it('falls back to an uppercased code for unknown languages', () => {
      expect(formatLanguage('xx')).toBe('XX');
    });
  });
});
