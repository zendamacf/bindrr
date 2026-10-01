'use client';

import {
  Anchor,
  Group,
  Loader,
  Pagination,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { fetchCardSets, fetchCollectionActivity } from '@/lib/collection/api';
import { formatLogChange, formatLogOccurred } from '@/lib/collection/formatLogChange';
import { collectionKeys } from '@/lib/collection/query-keys';
import { routes } from '@/routes';
import { FinishLabel } from './FinishLabel';

export function CollectionActivityView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [filterSet, setFilterSet] = useState<string | null>(null);
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const activityParams = {
    page,
    filterSearch: debouncedSearch || undefined,
    filterSet,
    filterFrom: filterFrom || undefined,
    filterTo: filterTo || undefined,
  };

  const setsQuery = useQuery({
    queryKey: collectionKeys.sets(),
    queryFn: fetchCardSets,
  });

  const activityQuery = useQuery({
    queryKey: collectionKeys.activity(activityParams),
    queryFn: () => fetchCollectionActivity(activityParams),
    placeholderData: keepPreviousData,
  });

  const data = activityQuery.data;
  const loading = activityQuery.isPending && !data;
  const error = activityQuery.error?.message ?? null;

  const setOptions =
    setsQuery.data?.map((set) => ({
      value: String(set.id),
      label: `${set.name} (${set.code.toUpperCase()})`,
    })) ?? [];

  return (
    <Stack gap="md" pt="xs">
      <div>
        <Anchor href={routes.collection} size="sm">
          Back to collection
        </Anchor>
        <Title order={2} mt="xs">
          Collection activity
        </Title>
        <Text c="dimmed" size="sm" maw={640}>
          A timeline of quantity changes across your collection — adds, edits, and removals.
        </Text>
      </div>

      <Group align="flex-end" wrap="wrap" gap="sm">
        <TextInput
          label="Search cards"
          placeholder="Card name"
          value={search}
          onChange={(event) => {
            setSearch(event.currentTarget.value);
            setPage(1);
          }}
          style={{ flex: '1 1 12rem', minWidth: '12rem' }}
        />
        <Select
          label="Set"
          placeholder="All sets"
          clearable
          searchable
          data={setOptions}
          value={filterSet}
          onChange={(value) => {
            setFilterSet(value);
            setPage(1);
          }}
          style={{ flex: '1 1 12rem', minWidth: '12rem' }}
          nothingFoundMessage="No sets"
        />
        <TextInput
          label="From"
          type="date"
          value={filterFrom}
          onChange={(event) => {
            setFilterFrom(event.currentTarget.value);
            setPage(1);
          }}
        />
        <TextInput
          label="To"
          type="date"
          value={filterTo}
          onChange={(event) => {
            setFilterTo(event.currentTarget.value);
            setPage(1);
          }}
        />
      </Group>

      {loading && <Loader size="sm" />}
      {error && <Text c="red">{error}</Text>}

      {!loading && !error && data && data.total === 0 && (
        <Text c="dimmed">No activity recorded yet.</Text>
      )}

      {!loading && !error && data && data.entries.length > 0 && (
        <>
          <ScrollArea.Autosize mah={520} type="auto">
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>When</Table.Th>
                  <Table.Th>Card</Table.Th>
                  <Table.Th>Set</Table.Th>
                  <Table.Th>Finish</Table.Th>
                  <Table.Th ta="right">Change</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.entries.map((entry) => (
                  <Table.Tr key={entry.id}>
                    <Table.Td>{formatLogOccurred(entry.occurred)}</Table.Td>
                    <Table.Td>
                      {entry.cardName}
                      <Text span c="dimmed" size="xs">
                        {' '}
                        #{entry.collectorNumber}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {entry.setName}
                      <Text span c="dimmed" size="xs">
                        {' '}
                        ({entry.setCode.toUpperCase()})
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <FinishLabel foil={entry.foil} etched={entry.etched} />
                    </Table.Td>
                    <Table.Td
                      ta="right"
                      c={entry.change > 0 ? 'green' : entry.change < 0 ? 'red' : undefined}
                    >
                      {formatLogChange(entry.change)}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea.Autosize>

          {data.count > 1 && (
            <Group justify="center">
              <Pagination size="sm" total={data.count} value={page} onChange={setPage} />
            </Group>
          )}
        </>
      )}
    </Stack>
  );
}
