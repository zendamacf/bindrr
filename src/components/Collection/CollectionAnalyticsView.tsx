'use client';

import { LineChart } from '@mantine/charts';
import { Box, Loader, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { fetchCollectionAnalytics } from '@/lib/collection/api';
import { COLLECTION_ANALYTICS_DEFAULT_DAYS } from '@/lib/collection/collectionAnalyticsConstants';
import type { CollectionAnalyticsBreakdownRow } from '@/lib/collection/getCollectionAnalytics';
import { collectionKeys } from '@/lib/collection/query-keys';
import { formatMoney } from '@/utils/formatMoney';
import classes from './Analytics.module.css';
import { RaritySwatch } from './RaritySwatch';

function BreakdownList({
  title,
  rows,
  currencyCode,
  swatch = false,
  limit,
}: {
  title: string;
  rows: CollectionAnalyticsBreakdownRow[];
  currencyCode: string;
  /** Show a rarity swatch beside each label (the row key is the rarity code). */
  swatch?: boolean;
  /** Show only the top rows by value (rows arrive sorted). Shares still use every row. */
  limit?: number;
}) {
  const shown = limit ? rows.slice(0, limit) : rows;
  const hidden = rows.length - shown.length;
  const totalValue = rows.reduce((sum, row) => sum + row.value, 0);

  return (
    <Stack gap="sm" component="section" aria-label={title}>
      <h3 className={classes.breakdownTitle}>{title}</h3>
      {rows.length === 0 ? (
        <Text size="sm" c="dimmed">
          Nothing to show yet. Add cards to see this breakdown.
        </Text>
      ) : (
        <ul className={classes.rows}>
          {shown.map((row) => {
            const share = totalValue > 0 ? (row.value / totalValue) * 100 : 0;
            return (
              <li key={row.key} className={classes.row}>
                <span className={classes.label}>
                  {swatch && <RaritySwatch rarityCode={row.key} size={12} />}
                  <span className={classes.labelText} title={row.label}>
                    {row.label}
                  </span>
                  <span className={classes.count}>
                    {row.quantity} {row.quantity === 1 ? 'card' : 'cards'}
                  </span>
                </span>
                <span className={`${classes.value} numeric`}>
                  {formatMoney(row.value, currencyCode)}
                </span>
                <span
                  className={classes.track}
                  role="img"
                  aria-label={`${share.toFixed(0)}% of collection value`}
                >
                  <span className={classes.fill} style={{ display: 'block', width: `${share}%` }} />
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {hidden > 0 && (
        <Text size="xs" c="dimmed">
          and {hidden} more
        </Text>
      )}
    </Stack>
  );
}

/** Change between the first and last point of the chart window. */
function valueChange(points: { value: number }[]) {
  if (points.length < 2) return null;
  const first = points[0].value;
  const last = points[points.length - 1].value;
  const delta = last - first;
  return { delta, percent: first > 0 ? (delta / first) * 100 : null };
}

export function CollectionAnalyticsView() {
  const days = COLLECTION_ANALYTICS_DEFAULT_DAYS;

  const analyticsQuery = useQuery({
    queryKey: collectionKeys.analytics(days),
    queryFn: () => fetchCollectionAnalytics({ days }),
  });

  const data = analyticsQuery.data;
  const loading = analyticsQuery.isPending && !data;
  const error = analyticsQuery.error?.message ?? null;

  if (loading) {
    return (
      <Stack align="center" py="xl">
        <Loader />
      </Stack>
    );
  }

  if (error || !data) {
    return (
      <Text c="red" size="sm">
        {error ?? 'Failed to load analytics'}
      </Text>
    );
  }

  const chartData = data.valueOverTime.map((point) => ({
    date: point.date,
    value: point.value,
  }));

  const change = valueChange(chartData);
  const changeColor =
    change == null || change.delta === 0
      ? 'var(--mantine-color-dimmed)'
      : change.delta > 0
        ? 'light-dark(var(--mantine-color-green-8), var(--mantine-color-green-4))'
        : 'light-dark(var(--mantine-color-red-7), var(--mantine-color-red-4))';

  return (
    <Stack gap="xl" w="100%" maw="100%" style={{ minWidth: 0 }}>
      <Stack gap={4}>
        <Title order={2} fz={28}>
          Analytics
        </Title>
        <Text c="dimmed" size="sm">
          Totals and trends for your whole collection, in {data.currencyCode}.
        </Text>
      </Stack>

      <Stack gap={6}>
        <Box
          className="numeric"
          fz={40}
          fw={700}
          lh={1}
          style={{ color: 'light-dark(var(--mantine-color-gold-7), var(--mantine-color-gold-4))' }}
          data-testid="analytics-total"
        >
          {formatMoney(data.totalValue, data.currencyCode)}
        </Box>
        <Text size="sm" c="dimmed">
          across {data.totalCards} {data.totalCards === 1 ? 'card' : 'cards'}
        </Text>
      </Stack>

      <Stack gap="xs">
        <Title order={3} fz="lg">
          Value over time
        </Title>
        {chartData.length === 0 ? (
          <Text size="sm" c="dimmed">
            No price history yet. Values appear after your cards are synced.
          </Text>
        ) : (
          <div className={classes.chartPanel}>
            {change && (
              <Text className={`${classes.change} numeric`} style={{ color: changeColor }}>
                {change.delta > 0 ? '+' : change.delta < 0 ? '−' : ''}
                {formatMoney(Math.abs(change.delta), data.currencyCode)}
                {change.percent != null &&
                  ` (${change.percent > 0 ? '+' : change.percent < 0 ? '−' : ''}${Math.abs(change.percent).toFixed(1)}%)`}
                <Text span c="dimmed" size="sm" fw={400}>
                  {' '}
                  over the last {data.windowDays} days
                </Text>
              </Text>
            )}
            <Box w="100%" maw="100%" mt="sm" style={{ minWidth: 0, overflow: 'hidden' }}>
              <LineChart
                w="100%"
                h={300}
                data={chartData}
                dataKey="date"
                series={[{ name: 'value', color: 'violet.6' }]}
                curveType="monotone"
                withDots={false}
                strokeWidth={2.5}
                yAxisProps={{ domain: ['auto', 'auto'], width: 76 }}
                valueFormatter={(value) => formatMoney(value, data.currencyCode) ?? '—'}
                lineChartProps={{ margin: { left: 4, right: 8 } }}
              />
            </Box>
          </div>
        )}
      </Stack>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
        <BreakdownList
          title="By set"
          rows={data.bySet}
          currencyCode={data.currencyCode}
          limit={8}
        />
        <BreakdownList
          title="By rarity"
          rows={data.byRarity}
          currencyCode={data.currencyCode}
          swatch
        />
        <BreakdownList title="By finish" rows={data.byFinish} currencyCode={data.currencyCode} />
      </SimpleGrid>
    </Stack>
  );
}
