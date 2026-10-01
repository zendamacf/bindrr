import { priceFromHistoryPoint } from './priceTrend';
import type { PriceHistoryPoint } from './types';

export type PortfolioHolding = {
  printingId: number;
  quantity: number;
  foil: boolean;
  etched: boolean;
};

export type PortfolioValuePoint = {
  date: string;
  value: number;
};

/** Latest known unit price for a finish on or before `date`. */
export function forwardFilledPriceOnDate(
  points: PriceHistoryPoint[],
  date: string,
  foil: boolean,
  etched: boolean,
): number | null {
  let last: number | null = null;
  for (const point of points) {
    if (point.date > date) break;
    const value = priceFromHistoryPoint(point, foil, etched);
    if (value != null) last = value;
  }
  return last;
}

export function collectHistoryDatesInWindow(
  historyByPrintingId: Map<number, PriceHistoryPoint[]>,
  cutoffDate: string,
): string[] {
  const dates = new Set<string>();
  for (const points of historyByPrintingId.values()) {
    for (const point of points) {
      if (point.date >= cutoffDate) dates.add(point.date);
    }
  }
  return [...dates].sort();
}

export function buildPortfolioValueSeries(
  holdings: PortfolioHolding[],
  historyByPrintingId: Map<number, PriceHistoryPoint[]>,
  dates: string[],
  convertUsd: (usd: number) => number,
): PortfolioValuePoint[] {
  if (dates.length === 0) return [];

  return dates.map((date) => {
    let totalUsd = 0;
    for (const holding of holdings) {
      const points = historyByPrintingId.get(holding.printingId) ?? [];
      const unitUsd = forwardFilledPriceOnDate(points, date, holding.foil, holding.etched);
      if (unitUsd != null) {
        totalUsd += holding.quantity * unitUsd;
      }
    }
    return { date, value: convertUsd(totalUsd) };
  });
}
