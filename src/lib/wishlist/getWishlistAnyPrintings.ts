import { and, asc, eq } from 'drizzle-orm';
import { CARD_FINISHES, type CardFinish } from '@/lib/collection/finish';
import { printingImageUrl } from '@/lib/collection/helpers';
import { printingFinishAvailability } from '@/lib/collection/printingFinishAvailability';
import { convertUsdPriceString, getExchangeRateForCode } from '@/lib/currency/convert';
import { db } from '@/lib/db';
import { card_sets, cards, printings, wishlist_cards } from '@/lib/db/schema';
import { normalizeScryfallLanguageCode } from '@/lib/scryfall/languages';
import { finishMatches } from './anyPrintingMatch';
import type { WishlistFinish } from './finish';
import type { GetWishlistAnyPrintingsResult, WishlistAnyPrintingOption } from './types';

/**
 * Returns the printings that the user can pick when they add an any-printing entry
 * to the collection. Only finishes that match the entry are included.
 * All languages are included. The printings are sorted cheapest first.
 * Returns null when the entry does not exist or the user does not own it.
 */
export async function getWishlistAnyPrintings(params: {
  userId: number;
  wishlistCardId: number;
  currencyCode?: string;
}): Promise<GetWishlistAnyPrintingsResult | null> {
  const [entry] = await db
    .select({
      cardId: wishlist_cards.card_id,
      name: cards.name,
      finish: wishlist_cards.finish,
    })
    .from(wishlist_cards)
    .innerJoin(cards, eq(wishlist_cards.card_id, cards.id))
    .where(
      and(eq(wishlist_cards.id, params.wishlistCardId), eq(wishlist_cards.user_id, params.userId)),
    )
    .limit(1);
  if (!entry) return null;

  const rows = await db
    .select({
      scryfallId: printings.scryfall_id,
      setName: card_sets.name,
      setCode: card_sets.code,
      collectorNumber: printings.collectornumber,
      language: printings.language,
      price: printings.price,
      foilprice: printings.foilprice,
      etchedprice: printings.etchedprice,
    })
    .from(printings)
    .innerJoin(card_sets, eq(printings.card_set_id, card_sets.id))
    .where(eq(printings.card_id, entry.cardId))
    .orderBy(asc(card_sets.released), asc(printings.id));

  const { currencyCode, rate } = await getExchangeRateForCode(params.currencyCode);
  const entryFinish = entry.finish as WishlistFinish;

  const options: (WishlistAnyPrintingOption & { sortPrice: number })[] = [];
  for (const row of rows) {
    if (row.scryfallId == null) continue;
    const available = printingFinishAvailability(row.price, row.foilprice, row.etchedprice);
    const prices: Record<CardFinish, string | null> = {
      nonfoil: row.price,
      foil: row.foilprice,
      etched: row.etchedprice,
    };
    const canAdd: Record<CardFinish, boolean> = {
      nonfoil: available.canAddNonfoil,
      foil: available.canAddFoil,
      etched: available.canAddEtched,
    };
    const finishes = CARD_FINISHES.filter(
      (finish) => canAdd[finish] && finishMatches(entryFinish, finish),
    ).map((finish) => ({ finish, price: convertUsdPriceString(prices[finish], rate) }));
    if (finishes.length === 0) continue;

    const known = finishes.map((f) => f.price).filter((p): p is number => p != null);
    options.push({
      scryfallId: row.scryfallId,
      setName: row.setName,
      setCode: row.setCode,
      collectorNumber: row.collectorNumber,
      languageCode: normalizeScryfallLanguageCode(row.language),
      imageUrl: printingImageUrl(row.scryfallId),
      finishes,
      sortPrice: known.length > 0 ? Math.min(...known) : Number.POSITIVE_INFINITY,
    });
  }

  options.sort((a, b) => a.sortPrice - b.sortPrice);
  return {
    name: entry.name,
    printings: options.map(({ sortPrice: _sortPrice, ...option }) => option),
    currencyCode,
  };
}
