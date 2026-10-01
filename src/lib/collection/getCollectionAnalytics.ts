import { and, asc, eq, gte, inArray, sql } from 'drizzle-orm';
import { convertUsdAmount, getExchangeRateForCode } from '@/lib/currency/convert';
import { db } from '@/lib/db';
import {
  card_sets,
  collection_printings,
  printing_price_history,
  printings,
} from '@/lib/db/schema';
import { finishLabelForFinish } from './finish';
import { parsePriceHistoryDaysParam } from './getPrintingPriceHistory';
import { rarityLabel } from './helpers';
import {
  buildPortfolioValueSeries,
  collectHistoryDatesInWindow,
  type PortfolioHolding,
} from './portfolioValueSeries';
import { toUtcDateString } from './printingPrices';
import type { PriceHistoryPoint } from './types';

const unitPriceSql = sql`CASE
  WHEN ${collection_printings.etched} THEN COALESCE(${printings.etchedprice}, 0)
  WHEN ${collection_printings.foil} THEN COALESCE(${printings.foilprice}, 0)
  ELSE COALESCE(${printings.price}, 0)
END`;

const finishKeySql = sql<string>`CASE
  WHEN ${collection_printings.etched} THEN 'etched'
  WHEN ${collection_printings.foil} THEN 'foil'
  ELSE 'nonfoil'
END`;

export type CollectionAnalyticsBreakdownRow = {
  key: string;
  label: string;
  quantity: number;
  value: number;
};

export type CollectionAnalyticsResult = {
  currencyCode: string;
  totalCards: number;
  totalValue: number;
  valueOverTime: { date: string; value: number }[];
  windowDays: number;
  bySet: CollectionAnalyticsBreakdownRow[];
  byRarity: CollectionAnalyticsBreakdownRow[];
  byFinish: CollectionAnalyticsBreakdownRow[];
};

export type GetCollectionAnalyticsParams = {
  userId: number;
  currencyCode?: string;
  days?: number;
  now?: Date;
};

export const COLLECTION_ANALYTICS_DEFAULT_DAYS = 90;

function cutoffDateString(days: number, now = new Date()): string {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - days);
  return toUtcDateString(d);
}

function formatRecordedOn(value: string | Date): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function toPriceHistoryPoint(row: {
  recordedOn: string | Date;
  price: string | null;
  foilprice: string | null;
  etchedprice: string | null;
}): PriceHistoryPoint {
  const parse = (raw: string | null): number | null => {
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };
  return {
    date: formatRecordedOn(row.recordedOn),
    nonfoil: parse(row.price),
    foil: parse(row.foilprice),
    etched: parse(row.etchedprice),
  };
}

function mapBreakdownRows(
  rows: { key: string | null; label: string | null; quantity: number; totalUsd: string }[],
  rate: number,
  labelForKey?: (key: string) => string,
): CollectionAnalyticsBreakdownRow[] {
  return rows
    .map((row) => {
      const key = row.key ?? 'unknown';
      const label = row.label ?? labelForKey?.(key) ?? key;
      const valueUsd = Number(row.totalUsd ?? 0);
      return {
        key,
        label,
        quantity: row.quantity,
        value: convertUsdAmount(valueUsd, rate) ?? 0,
      };
    })
    .sort((a, b) => b.value - a.value);
}

export async function getCollectionAnalytics(
  params: GetCollectionAnalyticsParams,
): Promise<CollectionAnalyticsResult> {
  const now = params.now ?? new Date();
  const windowDays = params.days ?? COLLECTION_ANALYTICS_DEFAULT_DAYS;
  const { currencyCode, rate } = await getExchangeRateForCode(params.currencyCode);

  const [totals] = await db
    .select({
      totalCards: sql<number>`coalesce(sum(${collection_printings.quantity}), 0)::int`,
      totalValueUsd: sql<string>`coalesce(sum(${collection_printings.quantity} * (${unitPriceSql})), 0)`,
    })
    .from(collection_printings)
    .innerJoin(printings, eq(collection_printings.printing_id, printings.id))
    .where(eq(collection_printings.user_id, params.userId));

  const bySetRows = await db
    .select({
      key: card_sets.code,
      label: card_sets.name,
      quantity: sql<number>`coalesce(sum(${collection_printings.quantity}), 0)::int`,
      totalUsd: sql<string>`coalesce(sum(${collection_printings.quantity} * (${unitPriceSql})), 0)`,
    })
    .from(collection_printings)
    .innerJoin(printings, eq(collection_printings.printing_id, printings.id))
    .innerJoin(card_sets, eq(printings.card_set_id, card_sets.id))
    .where(eq(collection_printings.user_id, params.userId))
    .groupBy(card_sets.id, card_sets.code, card_sets.name);

  const byRarityRows = await db
    .select({
      key: printings.rarity,
      label: sql<string | null>`null`,
      quantity: sql<number>`coalesce(sum(${collection_printings.quantity}), 0)::int`,
      totalUsd: sql<string>`coalesce(sum(${collection_printings.quantity} * (${unitPriceSql})), 0)`,
    })
    .from(collection_printings)
    .innerJoin(printings, eq(collection_printings.printing_id, printings.id))
    .where(eq(collection_printings.user_id, params.userId))
    .groupBy(printings.rarity);

  const byFinishRows = await db
    .select({
      key: finishKeySql,
      label: sql<string | null>`null`,
      quantity: sql<number>`coalesce(sum(${collection_printings.quantity}), 0)::int`,
      totalUsd: sql<string>`coalesce(sum(${collection_printings.quantity} * (${unitPriceSql})), 0)`,
    })
    .from(collection_printings)
    .innerJoin(printings, eq(collection_printings.printing_id, printings.id))
    .where(eq(collection_printings.user_id, params.userId))
    .groupBy(finishKeySql);

  const holdingsRows = await db
    .select({
      printingId: printings.id,
      quantity: collection_printings.quantity,
      foil: collection_printings.foil,
      etched: collection_printings.etched,
    })
    .from(collection_printings)
    .innerJoin(printings, eq(collection_printings.printing_id, printings.id))
    .where(eq(collection_printings.user_id, params.userId));

  const holdings: PortfolioHolding[] = holdingsRows.map((row) => ({
    printingId: row.printingId,
    quantity: row.quantity,
    foil: row.foil,
    etched: row.etched,
  }));

  const printingIds = [...new Set(holdings.map((h) => h.printingId))];
  const cutoff = cutoffDateString(windowDays, now);
  const historyByPrintingId = new Map<number, PriceHistoryPoint[]>();

  if (printingIds.length > 0) {
    const historyRows = await db
      .select({
        printingId: printing_price_history.printingId,
        recordedOn: printing_price_history.recordedOn,
        price: printing_price_history.price,
        foilprice: printing_price_history.foilprice,
        etchedprice: printing_price_history.etchedprice,
      })
      .from(printing_price_history)
      .where(
        and(
          inArray(printing_price_history.printingId, printingIds),
          gte(printing_price_history.recordedOn, cutoff),
        ),
      )
      .orderBy(asc(printing_price_history.printingId), asc(printing_price_history.recordedOn));

    for (const row of historyRows) {
      const points = historyByPrintingId.get(row.printingId) ?? [];
      points.push(toPriceHistoryPoint(row));
      historyByPrintingId.set(row.printingId, points);
    }
  }

  const convertUsd = (usd: number) => convertUsdAmount(usd, rate) ?? 0;
  const dates = collectHistoryDatesInWindow(historyByPrintingId, cutoff);
  const valueOverTime = buildPortfolioValueSeries(holdings, historyByPrintingId, dates, convertUsd);

  const finishLabel = (key: string) => finishLabelForFinish(key as 'nonfoil' | 'foil' | 'etched');

  return {
    currencyCode,
    totalCards: totals?.totalCards ?? 0,
    totalValue: convertUsd(Number(totals?.totalValueUsd ?? 0)),
    valueOverTime,
    windowDays,
    bySet: mapBreakdownRows(bySetRows, rate),
    byRarity: mapBreakdownRows(byRarityRows, rate, (key) => rarityLabel(key) ?? key),
    byFinish: mapBreakdownRows(byFinishRows, rate, finishLabel),
  };
}

export function parseCollectionAnalyticsDaysParam(value: string | null): number | undefined {
  return parsePriceHistoryDaysParam(value);
}
