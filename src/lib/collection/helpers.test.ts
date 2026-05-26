import { describe, expect, it } from 'vitest';
import {
  COLLECTION_PAGE_SIZE,
  formatLanguage,
  pageCount,
  printingImageUrl,
  rarityLabel,
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
      expect(unitPrice(true, '1.00', '5.00')).toBe(5);
    });

    it('uses normal price when foil is false', () => {
      expect(unitPrice(false, '1.00', '5.00')).toBe(1);
    });

    it('returns null when the relevant price is missing', () => {
      expect(unitPrice(false, null, '5.00')).toBeNull();
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

  describe('formatLanguage', () => {
    it('uppercases non-english languages', () => {
      expect(formatLanguage('jp')).toBe('JP');
    });

    it('returns null for english or missing language', () => {
      expect(formatLanguage('en')).toBeNull();
      expect(formatLanguage(null)).toBeNull();
    });
  });
});
