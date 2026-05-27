'use client';

import { LineChart } from '@mantine/charts';
import { Text } from '@mantine/core';
import { type CardFinish, finishLabelForFinish, finishMantineColor } from '@/lib/collection/finish';
import type { PriceHistoryPoint, PriceHistoryResult } from '@/lib/collection/types';
import { formatMoney } from '@/utils/formatMoney';

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

function buildChartSeries(result: PriceHistoryResult) {
  return FINISH_DATA_KEYS.filter((key) => result.series[key].hasData).map((key) => {
    const finish = FINISH_BY_KEY[key];
    return {
      name: key,
      label: finishLabelForFinish(finish),
      color: finishChartColor(finish),
    };
  });
}

function formatAxisDate(value: string): string {
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export type PriceHistoryChartProps = {
  history: PriceHistoryResult;
  currentFinish?: CardFinish;
};

export function PriceHistoryChart({ history, currentFinish }: PriceHistoryChartProps) {
  const series = buildChartSeries(history);

  if (history.points.length === 0 || series.length === 0) {
    return (
      <Text size="sm" c="dimmed" py="sm">
        No price history yet. Prices are recorded when this card is synced.
      </Text>
    );
  }

  const data: PriceHistoryPoint[] = history.points.map((point) => ({
    ...point,
    date: formatAxisDate(point.date),
  }));

  return (
    <LineChart
      h={280}
      data={data}
      dataKey="date"
      series={series}
      withLegend
      legendProps={{ verticalAlign: 'bottom' }}
      connectNulls={false}
      curveType="monotone"
      gridColor="gray.9"
      valueFormatter={(value) => formatMoney(value, history.currencyCode) ?? '—'}
      lineProps={(lineSeries) => ({
        strokeDasharray: lineSeries.name !== currentFinish ? '5 5' : undefined,
      })}
    />
  );
}
