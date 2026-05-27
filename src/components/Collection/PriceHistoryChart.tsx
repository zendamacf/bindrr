'use client';

import { LineChart } from '@mantine/charts';
import { Text } from '@mantine/core';
import type { CardFinish } from '@/lib/collection/finish';
import type { PriceHistoryResult } from '@/lib/collection/types';
import { formatMoney } from '@/utils/formatMoney';
import { buildChartSeries, chartDataFromHistory } from './priceHistoryChartUtils';

export type PriceHistoryChartProps = {
  history: PriceHistoryResult;
  currentFinish?: CardFinish;
};

export function PriceHistoryChart({ history, currentFinish }: PriceHistoryChartProps) {
  const series = buildChartSeries(history, currentFinish);

  if (history.points.length === 0 || series.length === 0) {
    return (
      <Text size="sm" c="dimmed" py="sm">
        No price history yet. Prices are recorded when this card is synced.
      </Text>
    );
  }

  return (
    <LineChart
      h={280}
      data={chartDataFromHistory(history)}
      dataKey="date"
      series={series}
      withLegend
      legendProps={{ verticalAlign: 'bottom' }}
      connectNulls={false}
      curveType="monotone"
      unit={history.currencyCode}
      valueFormatter={(value) => formatMoney(value, history.currencyCode) ?? '—'}
      lineProps={(lineSeries) => ({
        strokeWidth: lineSeries.name === currentFinish ? 3 : 2,
      })}
    />
  );
}
