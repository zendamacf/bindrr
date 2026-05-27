import { and, asc, gte, inArray } from 'drizzle-orm';
import { toUtcDateString } from '@/lib/collection/printingPrices';
import { db } from '@/lib/db';
import { printing_price_history } from '@/lib/db/schema';
import { buildPriceTrend, PRICE_TREND_DAYS, type PriceTrend } from './priceTrend';
import type { PriceHistoryPoint } from './types';

export type PriceTrendInput = {
  printingId: number;
  foil: boolean;
  etched: boolean;
};

export function priceTrendKey({ printingId, foil, etched }: PriceTrendInput): string {
  return `${printingId}:${foil ? 1 : 0}:${etched ? 1 : 0}`;
}

function parseNumeric(raw: string | null): number | null {
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function cutoffDateString(now: Date): string {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - PRICE_TREND_DAYS);
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
  return {
    date: formatRecordedOn(row.recordedOn),
    nonfoil: parseNumeric(row.price),
    foil: parseNumeric(row.foilprice),
    etched: parseNumeric(row.etchedprice),
  };
}

/**
 * Computes price trend for each unique printing/finish combo present in `inputs`.
 *
 * Returned keys are stable string identifiers derived from {printingId, foil, etched},
 * so the caller can map the result back to its collection rows.
 */
export async function getPriceTrendsForPrintings(
  inputs: PriceTrendInput[],
  options?: { now?: Date },
): Promise<Record<string, PriceTrend>> {
  if (inputs.length === 0) return {};

  const now = options?.now ?? new Date();
  const cutoff = cutoffDateString(now);

  const printingIds = [...new Set(inputs.map((i) => i.printingId))];
  const rows = await db
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

  const pointsByPrintingId = new Map<number, PriceHistoryPoint[]>();
  for (const row of rows) {
    const points = pointsByPrintingId.get(row.printingId) ?? [];
    points.push(
      toPriceHistoryPoint({
        recordedOn: row.recordedOn,
        price: row.price,
        foilprice: row.foilprice,
        etchedprice: row.etchedprice,
      }),
    );
    pointsByPrintingId.set(row.printingId, points);
  }

  const results: Record<string, PriceTrend> = {};
  for (const input of inputs) {
    const key = priceTrendKey(input);
    if (results[key]) continue;

    const points = pointsByPrintingId.get(input.printingId) ?? [];
    results[key] = buildPriceTrend(points, input.foil, input.etched);
  }

  return results;
}
