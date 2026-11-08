import { describe, expect, it } from 'vitest';
import {
  isWishlistFinish,
  WISHLIST_FINISHES,
  wishlistFinishColor,
  wishlistFinishFlags,
  wishlistFinishLabel,
  wishlistUnitPrice,
} from './finish';

describe('isWishlistFinish', () => {
  it('accepts all wishlist finishes', () => {
    for (const finish of WISHLIST_FINISHES) {
      expect(isWishlistFinish(finish)).toBe(true);
    }
  });

  it('rejects other values', () => {
    expect(isWishlistFinish('shiny')).toBe(false);
    expect(isWishlistFinish(undefined)).toBe(false);
    expect(isWishlistFinish(1)).toBe(false);
  });
});

describe('wishlistUnitPrice', () => {
  const prices = { price: '1.50', foilprice: '4.00', etchedprice: '0.75' };

  it('returns the price of a specific finish', () => {
    expect(wishlistUnitPrice('nonfoil', prices)).toBe(1.5);
    expect(wishlistUnitPrice('foil', prices)).toBe(4);
    expect(wishlistUnitPrice('etched', prices)).toBe(0.75);
  });

  it('returns the lowest available price for any finish', () => {
    expect(wishlistUnitPrice('any', prices)).toBe(0.75);
    expect(wishlistUnitPrice('any', { price: null, foilprice: '3.00', etchedprice: null })).toBe(3);
  });

  it('returns null when there is no price', () => {
    const none = { price: null, foilprice: null, etchedprice: null };
    expect(wishlistUnitPrice('any', none)).toBeNull();
    expect(wishlistUnitPrice('foil', { ...prices, foilprice: 'abc' })).toBeNull();
  });
});

describe('wishlist finish display', () => {
  it('returns a label for each finish', () => {
    expect(WISHLIST_FINISHES.map(wishlistFinishLabel)).toEqual([
      'Any finish',
      'Non-foil',
      'Foil',
      'Etched',
    ]);
  });

  it('returns a color only for foil and etched', () => {
    expect(wishlistFinishColor('any')).toBeUndefined();
    expect(wishlistFinishColor('nonfoil')).toBeUndefined();
    expect(wishlistFinishColor('foil')).toBe('cyan');
    expect(wishlistFinishColor('etched')).toBe('violet');
  });

  it('returns the image flags for a finish', () => {
    expect(wishlistFinishFlags('any')).toEqual({ foil: false, etched: false });
    expect(wishlistFinishFlags('foil')).toEqual({ foil: true, etched: false });
    expect(wishlistFinishFlags('etched')).toEqual({ foil: false, etched: true });
  });
});
