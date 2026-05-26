'use client';

import { Badge, Group, Loader, Pagination, Select, Table, Text, TextInput } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { fetchCardSets, fetchCollection } from '@/lib/collection/api';
import { collectionKeys } from '@/lib/collection/query-keys';
import type { CollectionSort } from '@/lib/collection/types';
import { formatMoney } from '@/utils/formatMoney';
import { CollectionRow } from './CollectionRow';
import { SortableTh } from './SortableTh';

const RARITY_OPTIONS = [
  { value: '', label: 'All rarities' },
  { value: 'C', label: 'Common' },
  { value: 'U', label: 'Uncommon' },
  { value: 'R', label: 'Rare' },
  { value: 'M', label: 'Mythic' },
  { value: 'S', label: 'Special' },
];

export function CollectionView() {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<CollectionSort>('name');
  const [sortDesc, setSortDesc] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [filterSet, setFilterSet] = useState<string | null>(null);
  const [filterRarity, setFilterRarity] = useState<string | null>(null);

  const collectionParams = {
    page,
    sort,
    sortDesc,
    filterSearch: debouncedSearch || undefined,
    filterSet,
    filterRarity,
  };

  const setsQuery = useQuery({
    queryKey: collectionKeys.sets(),
    queryFn: fetchCardSets,
  });

  const collectionQuery = useQuery({
    queryKey: collectionKeys.list(collectionParams),
    queryFn: () => fetchCollection(collectionParams),
    placeholderData: keepPreviousData,
  });

  const data = collectionQuery.data;
  const loading = collectionQuery.isPending && !data;
  const error = collectionQuery.error?.message ?? null;

  const toggleSort = (column: CollectionSort) => {
    if (sort === column) {
      setSortDesc((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(column);
      setSortDesc('asc');
    }
    setPage(1);
  };

  const sortIndicator = (column: CollectionSort) => {
    if (sort !== column) return '';
    return sortDesc === 'asc' ? ' ↑' : ' ↓';
  };

  const setOptions =
    setsQuery.data?.map((s) => ({ value: String(s.id), label: `${s.name} (${s.code})` })) ?? [];

  return (
    <>
      <Group mb="md" grow preventGrowOverflow={false} wrap="wrap">
        <TextInput
          placeholder="Search cards…"
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            setPage(1);
          }}
        />
        <Select
          placeholder="Filter by set"
          clearable
          searchable
          data={setOptions}
          value={filterSet}
          onChange={(v) => {
            setFilterSet(v);
            setPage(1);
          }}
        />
        <Select
          placeholder="Filter by rarity"
          data={RARITY_OPTIONS}
          value={filterRarity ?? ''}
          onChange={(v) => {
            setFilterRarity(v || null);
            setPage(1);
          }}
        />
      </Group>

      {data && (
        <Group mb="md" justify="space-between">
          <Badge size="lg" variant="light">
            {formatMoney(data.totalPrice, 'USD')} | {data.total} cards
          </Badge>
        </Group>
      )}

      {loading && (
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      )}

      {error && !loading && (
        <Text c="red" ta="center" py="xl">
          {error}
        </Text>
      )}

      {!loading && !error && data && (
        <>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <SortableTh
                  column="name"
                  label="Name"
                  onSort={toggleSort}
                  indicator={sortIndicator}
                />
                <Table.Th>Set</Table.Th>
                <SortableTh
                  column="rarity"
                  label="Rarity"
                  onSort={toggleSort}
                  indicator={sortIndicator}
                />
                <SortableTh
                  column="quantity"
                  label="Qty"
                  onSort={toggleSort}
                  indicator={sortIndicator}
                />
                <SortableTh
                  column="foil"
                  label="Foil"
                  onSort={toggleSort}
                  indicator={sortIndicator}
                />
                <SortableTh
                  column="price"
                  label="Price"
                  onSort={toggleSort}
                  indicator={sortIndicator}
                />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.cards.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text ta="center" c="dimmed" py="lg">
                      No cards in your collection yet.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                data.cards.map((card) => (
                  <CollectionRow key={card.collectionPrintingId} card={card} />
                ))
              )}
            </Table.Tbody>
          </Table>

          {data.count > 1 && (
            <Group justify="center" mt="lg">
              <Pagination total={data.count} value={page} onChange={setPage} />
            </Group>
          )}
        </>
      )}
    </>
  );
}
