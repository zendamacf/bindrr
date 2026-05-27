import { and, asc, eq, gte } from 'drizzle-orm';
import { convertUsdPriceString, getExchangeRateForCode } from '@/lib/currency/convert';
import { db } from '@/lib/db';
import { collection_printings, printing_price_history } from '@/lib/db/schema';
import type { PriceHistoryPoint, PriceHistoryResult, PriceHistorySeries } from './types';

export type { PriceHistoryPoint, PriceHistoryResult, PriceHistorySeries };

function emptySeries(): PriceHistorySeries {
  return {
    nonfoil: { hasData: false },
    foil: { hasData: false },
    etched: { hasData: false },
  };
}

function cutoffDateString(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function formatRecordedOn(value: string | Date): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export async function getPrintingPriceHistory(
  printingId: number,
  currencyCode?: string,
  options?: { days?: number },
): Promise<PriceHistoryResult> {
  const { currencyCode: resolvedCurrency, rate } = await getExchangeRateForCode(currencyCode);

  const conditions = [eq(printing_price_history.printingId, printingId)];
  if (options?.days != null && options.days > 0) {
    conditions.push(gte(printing_price_history.recordedOn, cutoffDateString(options.days)));
  }

  const rows = await db
    .select({
      recordedOn: printing_price_history.recordedOn,
      price: printing_price_history.price,
      foilprice: printing_price_history.foilprice,
      etchedprice: printing_price_history.etchedprice,
    })
    .from(printing_price_history)
    .where(and(...conditions))
    .orderBy(asc(printing_price_history.recordedOn));

  const series = emptySeries();
  const points: PriceHistoryPoint[] = rows.map((row) => {
    const nonfoil = convertUsdPriceString(row.price, rate);
    const foil = convertUsdPriceString(row.foilprice, rate);
    const etched = convertUsdPriceString(row.etchedprice, rate);

    if (nonfoil != null) series.nonfoil.hasData = true;
    if (foil != null) series.foil.hasData = true;
    if (etched != null) series.etched.hasData = true;

    return {
      date: formatRecordedOn(row.recordedOn),
      nonfoil,
      foil,
      etched,
    };
  });

  return {
    currencyCode: resolvedCurrency,
    points,
    series,
  };
}

export async function getCollectionItemPriceHistory(
  userId: number,
  collectionPrintingId: number,
  currencyCode?: string,
  options?: { days?: number },
): Promise<PriceHistoryResult | null> {
  const [row] = await db
    .select({ printingId: collection_printings.printing_id })
    .from(collection_printings)
    .where(
      and(
        eq(collection_printings.id, collectionPrintingId),
        eq(collection_printings.user_id, userId),
      ),
    )
    .limit(1);

  if (!row) return null;

  return getPrintingPriceHistory(row.printingId, currencyCode, options);
}

export function parsePriceHistoryDaysParam(value: string | null): number | undefined {
  if (value == null || value === '') return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return parsed;
}
