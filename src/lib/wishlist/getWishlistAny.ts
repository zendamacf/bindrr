import { asc, eq, inArray } from 'drizzle-orm';
import { printingImageUrl } from '@/lib/collection/helpers';
import { convertUsdAmount, getExchangeRateForCode } from '@/lib/currency/convert';
import { db } from '@/lib/db';
import { card_sets, cards, collection_printings, printings, wishlist_cards } from '@/lib/db/schema';
import { normalizeScryfallLanguageCode } from '@/lib/scryfall/languages';
import { cheapestMatchingPrinting, countOwnedCopies } from './anyPrintingMatch';
import type { WishlistFinish } from './finish';
import type { GetWishlistAnyResult, WishlistAnyCard } from './types';

function groupByCardId<T extends { cardId: number }>(rows: T[]): Map<number, T[]> {
  const groups = new Map<number, T[]>();
  for (const row of rows) {
    const group = groups.get(row.cardId);
    if (group) group.push(row);
    else groups.set(row.cardId, [row]);
  }
  return groups;
}

/**
 * Returns the wishlist entries for any printing, with the cheapest matching printing
 * and the number of matching copies that the user owns.
 */
export async function getWishlistAny(params: {
  userId: number;
  currencyCode?: string;
}): Promise<GetWishlistAnyResult> {
  const entries = await db
    .select({
      id: wishlist_cards.id,
      cardId: wishlist_cards.card_id,
      name: cards.name,
      finish: wishlist_cards.finish,
      quantity: wishlist_cards.quantity,
      createdAt: wishlist_cards.created_at,
    })
    .from(wishlist_cards)
    .innerJoin(cards, eq(wishlist_cards.card_id, cards.id))
    .where(eq(wishlist_cards.user_id, params.userId))
    .orderBy(asc(cards.name), asc(wishlist_cards.id));

  const { currencyCode, rate } = await getExchangeRateForCode(params.currencyCode);
  if (entries.length === 0) return { cards: [], totalPrice: 0, currencyCode };

  const cardIds = [...new Set(entries.map((entry) => entry.cardId))];

  const printingRows = await db
    .select({
      printingId: printings.id,
      cardId: printings.card_id,
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
    .where(inArray(printings.card_id, cardIds))
    .orderBy(asc(card_sets.released), asc(printings.id));

  const ownedRows = await db
    .select({
      cardId: printings.card_id,
      foil: collection_printings.foil,
      etched: collection_printings.etched,
      quantity: collection_printings.quantity,
    })
    .from(collection_printings)
    .innerJoin(printings, eq(collection_printings.printing_id, printings.id))
    .where(inArray(printings.card_id, cardIds));

  const printingsByCard = groupByCardId(printingRows);
  const ownedByCard = groupByCardId(ownedRows);

  let totalUsd = 0;
  const wishlistCards: WishlistAnyCard[] = entries.map((entry) => {
    const finish = entry.finish as WishlistFinish;
    const best = cheapestMatchingPrinting(printingsByCard.get(entry.cardId) ?? [], finish);
    const owned = countOwnedCopies(ownedByCard.get(entry.cardId) ?? [], finish);
    const missing = Math.max(0, entry.quantity - owned);
    if (best) totalUsd += best.price * missing;

    return {
      wishlistCardId: entry.id,
      cardId: entry.cardId,
      name: entry.name,
      quantity: entry.quantity,
      owned,
      missing,
      finish,
      cheapest: best
        ? {
            scryfallId: best.printing.scryfallId,
            setName: best.printing.setName,
            setCode: best.printing.setCode,
            collectorNumber: best.printing.collectorNumber,
            languageCode: normalizeScryfallLanguageCode(best.printing.language),
            finish: best.finish,
            price: convertUsdAmount(best.price, rate),
            imageUrl: printingImageUrl(best.printing.scryfallId),
          }
        : null,
      currencyCode,
      addedAt: entry.createdAt.toISOString(),
    };
  });

  return {
    cards: wishlistCards,
    totalPrice: convertUsdAmount(totalUsd, rate) ?? 0,
    currencyCode,
  };
}
