import { CARD_FINISHES, type CardFinish } from '@/lib/collection/finish';

/** A wishlist finish. The value `any` accepts all finishes of the printing. */
export type WishlistFinish = CardFinish | 'any';

export const WISHLIST_FINISHES: WishlistFinish[] = ['any', ...CARD_FINISHES];

export function isWishlistFinish(value: unknown): value is WishlistFinish {
  return typeof value === 'string' && (WISHLIST_FINISHES as string[]).includes(value);
}

function toPrice(raw: string | null): number | null {
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Returns the USD unit price for a wishlist finish.
 * For `any`, this function returns the lowest available price.
 */
export function wishlistUnitPrice(
  finish: WishlistFinish,
  prices: { price: string | null; foilprice: string | null; etchedprice: string | null },
): number | null {
  const nonfoil = toPrice(prices.price);
  const foil = toPrice(prices.foilprice);
  const etched = toPrice(prices.etchedprice);

  switch (finish) {
    case 'nonfoil':
      return nonfoil;
    case 'foil':
      return foil;
    case 'etched':
      return etched;
    default: {
      const available = [nonfoil, foil, etched].filter((n): n is number => n != null);
      return available.length > 0 ? Math.min(...available) : null;
    }
  }
}
