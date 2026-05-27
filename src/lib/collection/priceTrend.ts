import type { PriceHistoryPoint } from './types';

/** Single source of truth for the window used by collection trend badges. */
export const PRICE_TREND_DAYS = 30 as const;

export type PriceTrend = {
  changePercent: number | null;
  /** True when there is enough history to compute a trend (>= 2 non-null prices). */
  hasHistory: boolean;
  /** Included in the API response so UI tooltip can describe the period without hardcoding. */
  windowDays: number;
};

export function priceFromHistoryPoint(
  point: PriceHistoryPoint,
  foil: boolean,
  etched: boolean,
): number | null {
  if (etched) return point.etched;
  if (foil) return point.foil;
  return point.nonfoil;
}

function roundTo1Decimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function buildPriceTrend(
  points: PriceHistoryPoint[],
  foil: boolean,
  etched: boolean,
): PriceTrend {
  const series = points
    .map((p) => priceFromHistoryPoint(p, foil, etched))
    .filter((v): v is number => v != null);

  const windowDays = PRICE_TREND_DAYS;
  const hasHistory = series.length >= 2;

  if (!hasHistory) {
    return { changePercent: null, hasHistory: false, windowDays };
  }

  const firstPrice = series[0];
  const lastPrice = series[series.length - 1];

  if (!Number.isFinite(firstPrice) || firstPrice === 0 || !Number.isFinite(lastPrice)) {
    return { changePercent: null, hasHistory: true, windowDays };
  }

  const raw = ((lastPrice - firstPrice) / firstPrice) * 100;
  const changePercent = roundTo1Decimal(raw);

  return { changePercent, hasHistory: true, windowDays };
}
