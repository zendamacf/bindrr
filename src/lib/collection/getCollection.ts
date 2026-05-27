import { and, asc, desc, eq, ilike, sql } from 'drizzle-orm';
import { getPriceTrendsForPrintingsCached } from '@/lib/cache/priceTrends';
import { convertUsdAmount, getExchangeRateForCode } from '@/lib/currency/convert';
import { db } from '@/lib/db';
import { card_sets, cards, collection_printings, printings } from '@/lib/db/schema';
import { normalizeScryfallLanguageCode } from '@/lib/scryfall/languages';
import { type PriceTrendInput, priceTrendKey } from './getPriceTrendsForPrintings';
import {
  COLLECTION_PAGE_SIZE,
  formatLanguage,
  pageCount,
  printingImageUrl,
  rarityLabel,
  unitPrice,
} from './helpers';
import type {
  CollectionCard,
  CollectionSort,
  GetCollectionParams,
  GetCollectionResult,
  SortDirection,
} from './types';

const priceSql = sql`CASE
  WHEN ${collection_printings.etched} THEN COALESCE(${printings.etchedprice}, 0)
  WHEN ${collection_printings.foil} THEN COALESCE(${printings.foilprice}, 0)
  ELSE COALESCE(${printings.price}, 0)
END`;

const raritySortSql = sql`CASE ${printings.rarity}
  WHEN 'C' THEN 1
  WHEN 'U' THEN 2
  WHEN 'R' THEN 3
  WHEN 'M' THEN 4
  WHEN 'S' THEN 5
  ELSE 6
END`;

function buildWhere(userId: number, params: GetCollectionParams) {
  const conditions = [eq(collection_printings.user_id, userId)];

  if (params.filterSearch?.trim()) {
    conditions.push(ilike(cards.name, `%${params.filterSearch.trim()}%`));
  }
  if (params.filterSet != null) {
    conditions.push(eq(printings.card_set_id, params.filterSet));
  }
  if (params.filterRarity) {
    conditions.push(eq(printings.rarity, params.filterRarity));
  }

  return and(...conditions);
}

function orderBy(sort: CollectionSort, sortDesc: SortDirection) {
  const dir = sortDesc === 'desc' ? desc : asc;

  switch (sort) {
    case 'setname':
      return [dir(card_sets.released), asc(card_sets.code), asc(printings.collectornumber)];
    case 'rarity':
      return [dir(raritySortSql), asc(card_sets.code), asc(printings.collectornumber)];
    case 'quantity':
      return [
        dir(collection_printings.quantity),
        asc(card_sets.code),
        asc(printings.collectornumber),
      ];
    case 'foil':
      return [
        dir(collection_printings.etched),
        dir(collection_printings.foil),
        asc(card_sets.code),
        asc(printings.collectornumber),
      ];
    case 'price':
      return [dir(priceSql), asc(card_sets.code), asc(printings.collectornumber)];
    default:
      return [dir(cards.name), asc(card_sets.code), asc(printings.collectornumber)];
  }
}

export async function getCollection(params: GetCollectionParams): Promise<GetCollectionResult> {
  const page = Math.max(1, params.page ?? 1);
  const sort = params.sort ?? 'name';
  const sortDesc = params.sortDesc ?? 'asc';
  const offset = (page - 1) * COLLECTION_PAGE_SIZE;
  const where = buildWhere(params.userId, params);

  const [aggregate] = await db
    .select({
      rowCount: sql<number>`count(*)::int`,
      total: sql<number>`coalesce(sum(${collection_printings.quantity}), 0)::int`,
      totalPrice: sql<string>`coalesce(sum(${collection_printings.quantity} * (${priceSql})), 0)`,
    })
    .from(collection_printings)
    .innerJoin(printings, eq(collection_printings.printing_id, printings.id))
    .innerJoin(cards, eq(printings.card_id, cards.id))
    .where(where);

  const rows = await db
    .select({
      collectionPrintingId: collection_printings.id,
      printingId: printings.id,
      name: cards.name,
      setName: card_sets.name,
      setCode: card_sets.code,
      rarityCode: printings.rarity,
      quantity: collection_printings.quantity,
      foil: collection_printings.foil,
      etched: collection_printings.etched,
      price: printings.price,
      foilprice: printings.foilprice,
      etchedprice: printings.etchedprice,
      language: printings.language,
      scryfallId: printings.scryfall_id,
    })
    .from(collection_printings)
    .innerJoin(printings, eq(collection_printings.printing_id, printings.id))
    .innerJoin(cards, eq(printings.card_id, cards.id))
    .innerJoin(card_sets, eq(printings.card_set_id, card_sets.id))
    .where(where)
    .orderBy(...orderBy(sort, sortDesc))
    .limit(COLLECTION_PAGE_SIZE)
    .offset(offset);

  const trendInputs: PriceTrendInput[] = rows.map((row) => ({
    printingId: row.printingId,
    foil: row.foil,
    etched: row.etched,
  }));
  const trendResults = await getPriceTrendsForPrintingsCached(trendInputs);

  const { currencyCode, rate } = await getExchangeRateForCode(params.currencyCode);

  const collectionCards: CollectionCard[] = rows.map((row) => {
    const baseUsd = unitPrice(row.foil, row.etched, row.price, row.foilprice, row.etchedprice);
    const base = convertUsdAmount(baseUsd, rate);
    const languageCode = normalizeScryfallLanguageCode(row.language);

    return {
      collectionPrintingId: row.collectionPrintingId,
      printingId: row.printingId,
      name: row.name,
      setName: row.setName,
      setCode: row.setCode,
      rarity: rarityLabel(row.rarityCode),
      quantity: row.quantity,
      foil: row.foil,
      etched: row.etched,
      price: base,
      basePrice: null,
      currencyCode,
      languageCode,
      language: formatLanguage(languageCode),
      imageUrl: printingImageUrl(row.scryfallId),
      priceTrend:
        trendResults[
          priceTrendKey({ printingId: row.printingId, foil: row.foil, etched: row.etched })
        ],
    };
  });

  const totalPriceUsd = Number(aggregate?.totalPrice ?? 0);

  return {
    cards: collectionCards,
    count: pageCount(aggregate?.rowCount ?? 0, COLLECTION_PAGE_SIZE),
    total: aggregate?.total ?? 0,
    totalPrice: convertUsdAmount(totalPriceUsd, rate) ?? 0,
    currencyCode,
  };
}
