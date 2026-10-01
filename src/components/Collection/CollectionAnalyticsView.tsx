'use client';

import { LineChart } from '@mantine/charts';
import { Loader, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { fetchCollectionAnalytics } from '@/lib/collection/api';
import type { CollectionAnalyticsBreakdownRow } from '@/lib/collection/getCollectionAnalytics';
import { COLLECTION_ANALYTICS_DEFAULT_DAYS } from '@/lib/collection/getCollectionAnalytics';
import { collectionKeys } from '@/lib/collection/query-keys';
import { formatMoney } from '@/utils/formatMoney';

function BreakdownTable({
  title,
  rows,
  currencyCode,
}: {
  title: string;
  rows: CollectionAnalyticsBreakdownRow[];
  currencyCode: string;
}) {
  return (
    <Stack gap="xs">
      <Title order={4}>{title}</Title>
      {rows.length === 0 ? (
        <Text size="sm" c="dimmed">
          No data yet.
        </Text>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th ta="right">Cards</Table.Th>
              <Table.Th ta="right">Value</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => (
              <Table.Tr key={row.key}>
                <Table.Td>{row.label}</Table.Td>
                <Table.Td ta="right">{row.quantity}</Table.Td>
                <Table.Td ta="right">{formatMoney(row.value, currencyCode)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
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

  return (
    <Stack gap="lg" py="md">
      <Stack gap={4}>
        <Title order={2}>Collection analytics</Title>
        <Text c="dimmed" size="sm">
          Portfolio totals and trends for your whole collection in {data.currencyCode}.
        </Text>
      </Stack>

      <Text size="lg" fw={600}>
        {formatMoney(data.totalValue, data.currencyCode)} total · {data.totalCards} cards
      </Text>

      <Stack gap="xs">
        <Title order={4}>Value over time</Title>
        {chartData.length === 0 ? (
          <Text size="sm" c="dimmed">
            No price history yet. Values appear after your cards are synced.
          </Text>
        ) : (
          <>
            <Text size="xs" c="dimmed">
              Last {data.windowDays} days, based on recorded daily prices.
            </Text>
            <LineChart
              h={280}
              data={chartData}
              dataKey="date"
              series={[{ name: 'value', color: 'violet.6' }]}
              curveType="monotone"
              unit={data.currencyCode}
              valueFormatter={(value) => formatMoney(value, data.currencyCode) ?? '—'}
            />
          </>
        )}
      </Stack>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        <BreakdownTable title="By set" rows={data.bySet} currencyCode={data.currencyCode} />
        <BreakdownTable title="By rarity" rows={data.byRarity} currencyCode={data.currencyCode} />
        <BreakdownTable title="By finish" rows={data.byFinish} currencyCode={data.currencyCode} />
      </SimpleGrid>
    </Stack>
  );
}
