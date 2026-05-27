import { type CardFinish, finishLabelForFinish, finishMantineColor } from '@/lib/collection/finish';
import type { PriceHistoryResult } from '@/lib/collection/types';

export const DEFAULT_PRICE_HISTORY_DAY_RANGE = '30';

export const PRICE_HISTORY_DAY_RANGES = [
  { label: '30d', value: '30', days: 30 },
  { label: '60d', value: '60', days: 60 },
  { label: '90d', value: '90', days: 90 },
  { label: '1y', value: '365', days: 365 },
  { label: 'All', value: 'all', days: undefined },
] as const;

export type PriceHistoryDayRange = (typeof PRICE_HISTORY_DAY_RANGES)[number]['value'];

export function priceHistoryDaysFromRange(range: PriceHistoryDayRange): number | undefined {
  const option = PRICE_HISTORY_DAY_RANGES.find((o) => o.value === range);
  return option?.days;
}

const FINISH_DATA_KEYS = ['nonfoil', 'foil', 'etched'] as const;

type FinishDataKey = (typeof FINISH_DATA_KEYS)[number];

const FINISH_BY_KEY: Record<FinishDataKey, CardFinish> = {
  nonfoil: 'nonfoil',
  foil: 'foil',
  etched: 'etched',
};

function finishChartColor(finish: CardFinish): string {
  const color = finishMantineColor(finish);
  return color ? `${color}.6` : 'gray.6';
}

export function formatChartAxisDate(value: string): string {
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function buildChartSeries(result: PriceHistoryResult, currentFinish?: CardFinish) {
  return FINISH_DATA_KEYS.filter((key) => result.series[key].hasData).map((key) => {
    const finish = FINISH_BY_KEY[key];
    const baseLabel = finishLabelForFinish(finish);
    return {
      name: key,
      label: currentFinish === finish ? `${baseLabel} (yours)` : baseLabel,
      color: finishChartColor(finish),
    };
  });
}

export function chartDataFromHistory(result: PriceHistoryResult) {
  return result.points.map((point) => ({
    ...point,
    date: formatChartAxisDate(point.date),
  }));
}
