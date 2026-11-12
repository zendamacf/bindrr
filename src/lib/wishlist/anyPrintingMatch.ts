import { CARD_FINISHES, type CardFinish } from '@/lib/collection/finish';
import type { WishlistFinish } from './finish';

export type MatchPrinting = {
  printingId: number;
  price: string | null;
  foilprice: string | null;
  etchedprice: string | null;
};

export type CheapestPrinting<T extends MatchPrinting> = {
  printing: T;
  finish: CardFinish;
  /** The unit price in USD. */
  price: number;
};

function usdPrice(printing: MatchPrinting, finish: CardFinish): number | null {
  const raw =
    finish === 'nonfoil'
      ? printing.price
      : finish === 'foil'
        ? printing.foilprice
        : printing.etchedprice;
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function finishMatches(entryFinish: WishlistFinish, finish: CardFinish): boolean {
  return entryFinish === 'any' || entryFinish === finish;
}

/**
 * Finds the cheapest printing and finish that match the finish of an entry.
 * Printings without a price for a matching finish are ignored.
 * Returns null when no printing has a price. On equal prices, the first printing wins.
 */
export function cheapestMatchingPrinting<T extends MatchPrinting>(
  printings: T[],
  entryFinish: WishlistFinish,
): CheapestPrinting<T> | null {
  let best: CheapestPrinting<T> | null = null;
  for (const printing of printings) {
    for (const finish of CARD_FINISHES) {
      if (!finishMatches(entryFinish, finish)) continue;
      const price = usdPrice(printing, finish);
      if (price != null && (best == null || price < best.price)) {
        best = { printing, finish, price };
      }
    }
  }
  return best;
}

/** Counts the owned copies that match the finish of an entry. */
export function countOwnedCopies(
  copies: { foil: boolean; etched: boolean; quantity: number }[],
  entryFinish: WishlistFinish,
): number {
  let owned = 0;
  for (const copy of copies) {
    const finish: CardFinish = copy.etched ? 'etched' : copy.foil ? 'foil' : 'nonfoil';
    if (finishMatches(entryFinish, finish)) owned += copy.quantity;
  }
  return owned;
}
