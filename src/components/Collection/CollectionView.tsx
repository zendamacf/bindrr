'use client';

import {
  Box,
  Button,
  Drawer,
  Group,
  Loader,
  Modal,
  Pagination,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { useDebouncedValue, useMediaQuery } from '@mantine/hooks';
import { FileCsvIcon } from '@phosphor-icons/react/FileCsv';
import { PlusIcon } from '@phosphor-icons/react/Plus';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { fetchCardSets, fetchCollection } from '@/lib/collection/api';
import { BINDER_PAGE_SIZE, COLLECTION_PAGE_SIZE } from '@/lib/collection/helpers';
import { collectionKeys } from '@/lib/collection/query-keys';
import type { CollectionCard, CollectionSort } from '@/lib/collection/types';
import { formatMoney } from '@/utils/formatMoney';
import { AddCardPanel } from './AddCardPanel';
import { BinderGrid, BinderPocket } from './BinderPocket';
import { CollectionCardRow } from './CollectionCardRow';
import { CollectionEditOverlay } from './CollectionEditOverlay';
import { CollectionRow } from './CollectionRow';
import { COLLECTION_EDIT_OVERLAY_Z_INDEX } from './collectionEditZIndex';
import { FinishLabel } from './FinishLabel';
import { ImportCsvModal } from './ImportCsvModal';
import { LanguageBadge } from './LanguageBadge';
import classes from './Listing.module.css';
import { ListingControls } from './ListingControls';
import { ListingEmptyState } from './ListingEmptyState';
import { PriceTrendBadge } from './PriceTrendBadge';
import { RaritySwatch } from './RaritySwatch';
import { SetSymbol } from './SetSymbol';
import { SortableTh } from './SortableTh';
import { useListingView } from './useListingView';

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
  const [importing, setImporting] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<CollectionSort>('name');
  const [sortDesc, setSortDesc] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [filterSet, setFilterSet] = useState<string | null>(null);
  const [filterRarity, setFilterRarity] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [view, setView, viewReady] = useListingView();
  const isMobile = useMediaQuery('(max-width: 48.75rem)', false);

  const collectionParams = {
    page,
    pageSize: view === 'binder' ? BINDER_PAGE_SIZE : COLLECTION_PAGE_SIZE,
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
    enabled: viewReady,
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

  const handleEdit = (c: CollectionCard) => setEditingId(c.collectionPrintingId);

  const hasFilters = Boolean(debouncedSearch || filterSet || filterRarity);
  const clearFilters = () => {
    setSearch('');
    setFilterSet(null);
    setFilterRarity(null);
    setPage(1);
  };

  const handleSortChange = (value: string | null) => {
    if (!value) return;
    setSort(value as CollectionSort);
    setSortDesc('asc');
    setPage(1);
  };

  const filterFields = (
    <>
      <TextInput
        data-testid="collection-search"
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
    <Stack data-testid="collection-view" gap="xs">
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

      <ImportCsvModal
        opened={importing}
        onClose={() => setImporting(false)}
        isMobile={!!isMobile}
      />

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
        <Group gap="xs" grow>
          <Button
            variant="default"
            leftSection={<FileCsvIcon size={16} />}
            onClick={() => setImporting(true)}
            data-testid="collection-import-csv"
          >
            Import CSV
          </Button>
          <Button
            leftSection={<PlusIcon size={16} />}
            onClick={() => setAdding(true)}
            data-testid="collection-add-cards"
          >
            Add cards
          </Button>
        </Group>
      </Stack>

      <Group
        mb="xs"
        justify="space-between"
        align="flex-end"
        wrap="wrap"
        gap="xs"
        visibleFrom="sm"
        data-testid="collection-desktop-toolbar"
      >
        <Group style={{ flex: 1 }} grow preventGrowOverflow={false} wrap="wrap" gap="xs">
          {filterFields}
        </Group>

        <Group gap="xs" className={classes.toolbarActions}>
          <Button
            variant="default"
            leftSection={<FileCsvIcon size={16} />}
            onClick={() => setImporting(true)}
            data-testid="collection-import-csv"
          >
            Import CSV
          </Button>
          <Button
            leftSection={<PlusIcon size={16} />}
            onClick={() => setAdding(true)}
            data-testid="collection-add-cards"
          >
            Add cards
          </Button>
        </Group>
      </Group>

      <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm" mb="sm">
        {data ? (
          <Group align="baseline" gap="sm" data-testid="collection-summary">
            <Text className={`${classes.total} numeric`}>
              {formatMoney(data.totalPrice, data.currencyCode)}
            </Text>
            <Text c="dimmed" size="sm">
              {data.total} {data.total === 1 ? 'card' : 'cards'}
            </Text>
          </Group>
        ) : (
          <span />
        )}

        <ListingControls
          view={view}
          onViewChange={(v) => {
            setView(v);
            setPage(1);
          }}
          showSort={view === 'binder' || !!isMobile}
          compact={!!isMobile}
          sort={sort}
          sortOptions={SORT_OPTIONS}
          onSortChange={(value) => handleSortChange(value)}
          sortDesc={sortDesc}
          onSortDirectionToggle={() => {
            setSortDesc((d) => (d === 'asc' ? 'desc' : 'asc'));
            setPage(1);
          }}
        />
      </Group>

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
          {data.cards.length === 0 ? (
            <ListingEmptyState
              testId="collection-empty"
              title={hasFilters ? 'No cards match these filters' : 'Your binder is empty'}
              text={
                hasFilters
                  ? 'Try a different search, set or rarity.'
                  : 'Add cards from Scryfall or import a CSV to start tracking their value.'
              }
              action={
                hasFilters ? (
                  <Button variant="default" mt="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : (
                  <Button
                    mt="sm"
                    leftSection={<PlusIcon size={16} />}
                    onClick={() => setAdding(true)}
                  >
                    Add cards
                  </Button>
                )
              }
            />
          ) : view === 'binder' ? (
            <BinderGrid key={page} testId="collection-binder">
              {data.cards.map((card, index) => (
                <BinderPocket
                  key={card.collectionPrintingId}
                  testId="collection-row"
                  name={card.name}
                  imageUrl={card.imageUrl}
                  foil={card.foil}
                  etched={card.etched}
                  quantity={card.quantity}
                  rarityCode={card.rarity?.charAt(0) ?? null}
                  setCode={card.setCode}
                  tags={
                    <>
                      {(card.foil || card.etched) && (
                        <FinishLabel foil={card.foil} etched={card.etched} size="xs" />
                      )}
                      <LanguageBadge languageCode={card.languageCode} />
                    </>
                  }
                  price={formatMoney(card.price, card.currencyCode) ?? '—'}
                  priceAside={<PriceTrendBadge trend={card.priceTrend} />}
                  index={index}
                  onOpen={() => handleEdit(card)}
                />
              ))}
            </BinderGrid>
          ) : (
            <>
              <Box hiddenFrom="sm">
                <Stack gap={0}>
                  {data.cards.map((card) => (
                    <CollectionCardRow
                      key={card.collectionPrintingId}
                      card={card}
                      onEdit={handleEdit}
                    />
                  ))}
                </Stack>
              </Box>

              <Box visibleFrom="sm" data-testid="collection-desktop-table">
                <Table.ScrollContainer minWidth={700} type="native">
                  <Table highlightOnHover verticalSpacing="sm" className={classes.table}>
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
                      {data.cards.map((card) => (
                        <CollectionRow
                          key={card.collectionPrintingId}
                          card={card}
                          onEdit={handleEdit}
                        />
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              </Box>
            </>
          )}

          {data.count > 1 && (
            <Group justify="center" mt="xl">
              <Pagination size="sm" total={data.count} value={page} onChange={setPage} withEdges />
            </Group>
          )}
        </>
      )}
    </Stack>
  );
}
