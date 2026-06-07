'use client';

import {
  Badge,
  Box,
  Button,
  Drawer,
  Group,
  Loader,
  Modal,
  Pagination,
  SegmentedControl,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { useDebouncedValue, useMediaQuery } from '@mantine/hooks';
import { PlusIcon } from '@phosphor-icons/react/Plus';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  type CardPreviewDetails,
  CardPreviewModal,
  previewFromCollectionCard,
} from '@/components/Card';
import { fetchCardSets, fetchCollection } from '@/lib/collection/api';
import { collectionKeys } from '@/lib/collection/query-keys';
import type { CollectionCard, CollectionSort } from '@/lib/collection/types';
import { formatMoney } from '@/utils/formatMoney';
import { AddCardPanel } from './AddCardPanel';
import { CollectionCardRow } from './CollectionCardRow';
import { CollectionEditOverlay } from './CollectionEditOverlay';
import { CollectionRow } from './CollectionRow';
import { COLLECTION_EDIT_OVERLAY_Z_INDEX } from './collectionEditZIndex';
import { RaritySwatch } from './RaritySwatch';
import { SetSymbol } from './SetSymbol';
import { SortableTh } from './SortableTh';

const RARITY_OPTIONS = [
  { value: '', label: 'All rarities' },
  { value: 'C', label: 'Common' },
  { value: 'U', label: 'Uncommon' },
  { value: 'R', label: 'Rare' },
  { value: 'M', label: 'Mythic' },
  { value: 'S', label: 'Special' },
];

const SORT_OPTIONS: { value: CollectionSort; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'setname', label: 'Set' },
  { value: 'rarity', label: 'Rarity' },
  { value: 'quantity', label: 'Qty' },
  { value: 'foil', label: 'Finish' },
  { value: 'price', label: 'Price' },
];

export function CollectionView() {
  const [adding, setAdding] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<CollectionSort>('name');
  const [sortDesc, setSortDesc] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [filterSet, setFilterSet] = useState<string | null>(null);
  const [filterRarity, setFilterRarity] = useState<string | null>(null);
  const [preview, setPreview] = useState<CardPreviewDetails | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const isMobile = useMediaQuery('(max-width: 48.75rem)', true);

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

  const setSymbols = new Map<number, string | null>(
    (setsQuery.data ?? []).map((s) => [s.id, s.symbolSvgUri]),
  );

  const setOptions =
    setsQuery.data?.map((s) => ({
      value: String(s.id),
      label: `${s.name} (${s.code})`,
    })) ?? [];

  const handlePreview = (c: CollectionCard) => setPreview(previewFromCollectionCard(c));
  const handleEdit = (c: CollectionCard) => setEditingId(c.collectionPrintingId);

  const handleMobileSortChange = (value: string | null) => {
    if (!value) return;
    setSort(value as CollectionSort);
    setSortDesc('asc');
    setPage(1);
  };

  const filterFields = (
    <>
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
        renderOption={(option) => (
          <Group>
            <SetSymbol setSymbolUrl={setSymbols.get(Number(option.option.value)) ?? null} />
            <Text>{option.option.label}</Text>
          </Group>
        )}
      />
      <Select
        placeholder="Filter by rarity"
        data={RARITY_OPTIONS}
        value={filterRarity ?? ''}
        onChange={(v) => {
          setFilterRarity(v || null);
          setPage(1);
        }}
        renderOption={(option) => (
          <Group>
            <RaritySwatch rarityCode={option.option.value || null} />
            <Text>{option.option.label}</Text>
          </Group>
        )}
      />
    </>
  );

  return (
    <>
      {isMobile ? (
        <Drawer
          opened={adding}
          onClose={() => setAdding(false)}
          position="bottom"
          title="Add cards"
          padding="md"
          size="100%"
          zIndex={COLLECTION_EDIT_OVERLAY_Z_INDEX}
        >
          <AddCardPanel variant="overlay" showHeader={false} onClose={() => setAdding(false)} />
        </Drawer>
      ) : (
        <Modal
          opened={adding}
          onClose={() => setAdding(false)}
          title="Add cards"
          size="xl"
          centered
          padding="md"
          zIndex={COLLECTION_EDIT_OVERLAY_Z_INDEX}
        >
          <AddCardPanel variant="overlay" showHeader={false} onClose={() => setAdding(false)} />
        </Modal>
      )}

      <CollectionEditOverlay
        opened={editingId != null}
        onClose={() => setEditingId(null)}
        collectionPrintingId={editingId}
        onCollectionPrintingIdChange={setEditingId}
        onRemoved={() => setEditingId(null)}
        isMobile={!!isMobile}
      />

      <Stack mb="xs" gap="xs" hiddenFrom="sm">
        {filterFields}
        <Button fullWidth leftSection={<PlusIcon size={16} />} onClick={() => setAdding(true)}>
          Add cards
        </Button>
      </Stack>

      <Group mb="xs" justify="space-between" align="flex-end" wrap="wrap" gap="xs" visibleFrom="sm">
        <Group style={{ flex: 1 }} grow preventGrowOverflow={false} wrap="wrap" gap="xs">
          {filterFields}
        </Group>

        <Box
          style={{
            borderLeft: '1px solid var(--mantine-color-gray-3)',
            paddingLeft: 12,
            marginLeft: 4,
          }}
        >
          <Button leftSection={<PlusIcon size={16} />} onClick={() => setAdding(true)}>
            Add cards
          </Button>
        </Box>
      </Group>

      {data && (
        <Group mb="xs" justify="space-between">
          <Badge size="lg" variant="light">
            {formatMoney(data.totalPrice, data.currencyCode)} | {data.total} cards
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
          <CardPreviewModal
            opened={preview != null}
            onClose={() => setPreview(null)}
            preview={preview}
          />

          <Box hiddenFrom="sm" mb="xs">
            <Group gap="xs" align="flex-end" grow preventGrowOverflow={false} wrap="nowrap">
              <Select
                label="Sort by"
                style={{ flex: 1, minWidth: 0 }}
                data={SORT_OPTIONS}
                value={sort}
                onChange={handleMobileSortChange}
                allowDeselect={false}
              />
              <SegmentedControl
                style={{ flexShrink: 0 }}
                value={sortDesc}
                onChange={(value) => {
                  setSortDesc(value as 'asc' | 'desc');
                  setPage(1);
                }}
                data={[
                  { label: '↑ Asc', value: 'asc' },
                  { label: '↓ Desc', value: 'desc' },
                ]}
              />
            </Group>
          </Box>

          <Box hiddenFrom="sm">
            {data.cards.length === 0 ? (
              <Text ta="center" c="dimmed" py="lg">
                No cards in your collection yet.
              </Text>
            ) : (
              <Stack gap={0}>
                {data.cards.map((card, index) => (
                  <CollectionCardRow
                    key={card.collectionPrintingId}
                    card={card}
                    striped={index % 2 === 1}
                    onPreview={handlePreview}
                    onEdit={handleEdit}
                  />
                ))}
              </Stack>
            )}
          </Box>

          <Box visibleFrom="sm">
            <Table.ScrollContainer minWidth={700} type="native">
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
                      label="Finish"
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
                      <Table.Td colSpan={6}>
                        <Text ta="center" c="dimmed" py="lg">
                          No cards in your collection yet.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    data.cards.map((card) => (
                      <CollectionRow
                        key={card.collectionPrintingId}
                        card={card}
                        onPreview={handlePreview}
                        onEdit={handleEdit}
                      />
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Box>

          {data.count > 1 && (
            <Group justify="center" mt="lg">
              <Pagination size="sm" total={data.count} value={page} onChange={setPage} />
            </Group>
          )}
        </>
      )}
    </>
  );
}
