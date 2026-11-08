import { and, asc, desc, eq, ilike, sql } from 'drizzle-orm';
import {
  COLLECTION_PAGE_SIZE,
  formatLanguage,
  pageCount,
  printingImageUrl,
  rarityLabel,
} from '@/lib/collection/helpers';
import type { SortDirection } from '@/lib/collection/types';
import { convertUsdAmount, getExchangeRateForCode } from '@/lib/currency/convert';
import { db } from '@/lib/db';
import { card_sets, cards, printings, wishlist_printings } from '@/lib/db/schema';
import { normalizeScryfallLanguageCode } from '@/lib/scryfall/languages';
import { type WishlistFinish, wishlistUnitPrice } from './finish';
import type { GetWishlistParams, GetWishlistResult, WishlistCard, WishlistSort } from './types';

export const WISHLIST_PAGE_SIZE = COLLECTION_PAGE_SIZE;

/** The unit price in USD. For finish `any`, LEAST() gives the lowest price and ignores NULL. */
const priceSql = sql`COALESCE(CASE ${wishlist_printings.finish}
  WHEN 'nonfoil' THEN ${printings.price}
  WHEN 'foil' THEN ${printings.foilprice}
  WHEN 'etched' THEN ${printings.etchedprice}
  ELSE LEAST(${printings.price}, ${printings.foilprice}, ${printings.etchedprice})
END, 0)`;

const raritySortSql = sql`CASE ${printings.rarity}
  WHEN 'C' THEN 1
  WHEN 'U' THEN 2
  WHEN 'R' THEN 3
  WHEN 'M' THEN 4
  WHEN 'S' THEN 5
  ELSE 6
END`;

const finishSortSql = sql`CASE ${wishlist_printings.finish}
  WHEN 'any' THEN 1
  WHEN 'nonfoil' THEN 2
  WHEN 'foil' THEN 3
  WHEN 'etched' THEN 4
  ELSE 5
END`;

function buildWhere(params: GetWishlistParams) {
  const conditions = [eq(wishlist_printings.user_id, params.userId)];

  if (params.filterSearch?.trim()) {
    conditions.push(ilike(cards.name, `%${params.filterSearch.trim()}%`));
  }
  if (params.filterSet != null) {
    conditions.push(eq(printings.card_set_id, params.filterSet));
  }
  if (params.filterRarity) {
    conditions.push(eq(printings.rarity, params.filterRarity));
  }
  if (params.filterFinish) {
    conditions.push(eq(wishlist_printings.finish, params.filterFinish));
  }

  return and(...conditions);
}

function orderBy(sort: WishlistSort, sortDesc: SortDirection) {
  const dir = sortDesc === 'desc' ? desc : asc;
  const tieBreak = [
    asc(card_sets.code),
    asc(printings.collectornumber),
    asc(wishlist_printings.id),
  ];

  switch (sort) {
    case 'setname':
      return [dir(card_sets.released), ...tieBreak];
    case 'rarity':
      return [dir(raritySortSql), ...tieBreak];
    case 'quantity':
      return [dir(wishlist_printings.quantity), ...tieBreak];
    case 'finish':
      return [dir(finishSortSql), ...tieBreak];
    case 'price':
      return [dir(priceSql), ...tieBreak];
    case 'added':
      return [dir(wishlist_printings.created_at), asc(wishlist_printings.id)];
    default:
      return [dir(cards.name), ...tieBreak];
  }
}

export async function getWishlist(params: GetWishlistParams): Promise<GetWishlistResult> {
  const page = Math.max(1, params.page ?? 1);
  const sort = params.sort ?? 'name';
  const sortDesc = params.sortDesc ?? 'asc';
  const offset = (page - 1) * WISHLIST_PAGE_SIZE;
  const where = buildWhere(params);

  const [aggregate] = await db
    .select({
      rowCount: sql<number>`count(*)::int`,
      total: sql<number>`coalesce(sum(${wishlist_printings.quantity}), 0)::int`,
      totalPrice: sql<string>`coalesce(sum(${wishlist_printings.quantity} * (${priceSql})), 0)`,
    })
    .from(wishlist_printings)
    .innerJoin(printings, eq(wishlist_printings.printing_id, printings.id))
    .innerJoin(cards, eq(printings.card_id, cards.id))
    .where(where);

  const rows = await db
    .select({
      wishlistPrintingId: wishlist_printings.id,
      printingId: printings.id,
      scryfallId: printings.scryfall_id,
      name: cards.name,
      setName: card_sets.name,
      setCode: card_sets.code,
      collectorNumber: printings.collectornumber,
      rarityCode: printings.rarity,
      quantity: wishlist_printings.quantity,
      finish: wishlist_printings.finish,
      price: printings.price,
      foilprice: printings.foilprice,
      etchedprice: printings.etchedprice,
      language: printings.language,
      createdAt: wishlist_printings.created_at,
    })
    .from(wishlist_printings)
    .innerJoin(printings, eq(wishlist_printings.printing_id, printings.id))
    .innerJoin(cards, eq(printings.card_id, cards.id))
    .innerJoin(card_sets, eq(printings.card_set_id, card_sets.id))
    .where(where)
    .orderBy(...orderBy(sort, sortDesc))
    .limit(WISHLIST_PAGE_SIZE)
    .offset(offset);

  const { currencyCode, rate } = await getExchangeRateForCode(params.currencyCode);

  const wishlistCards: WishlistCard[] = rows.map((row) => {
    // The database CHECK constraint permits only wishlist finish values.
    const finish = row.finish as WishlistFinish;
    const languageCode = normalizeScryfallLanguageCode(row.language);

    return {
      wishlistPrintingId: row.wishlistPrintingId,
      printingId: row.printingId,
      scryfallId: row.scryfallId,
      name: row.name,
      setName: row.setName,
      setCode: row.setCode,
      collectorNumber: row.collectorNumber,
      rarity: rarityLabel(row.rarityCode),
      quantity: row.quantity,
      finish,
      price: convertUsdAmount(wishlistUnitPrice(finish, row), rate),
      priceIsMinimum: finish === 'any',
      currencyCode,
      languageCode,
      language: formatLanguage(languageCode),
      imageUrl: printingImageUrl(row.scryfallId),
      addedAt: row.createdAt.toISOString(),
    };
  });

  const totalPriceUsd = Number(aggregate?.totalPrice ?? 0);

  return {
    cards: wishlistCards,
    count: pageCount(aggregate?.rowCount ?? 0, WISHLIST_PAGE_SIZE),
    total: aggregate?.total ?? 0,
    totalPrice: convertUsdAmount(totalPriceUsd, rate) ?? 0,
    currencyCode,
  };
}
