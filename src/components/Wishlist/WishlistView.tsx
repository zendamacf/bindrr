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
  Title,
} from '@mantine/core';
import { useDebouncedValue, useMediaQuery } from '@mantine/hooks';
import { PlusIcon } from '@phosphor-icons/react/Plus';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  type CardPreviewDetails,
  CardPreviewModal,
  previewFromWishlistCard,
} from '@/components/Card';
import { AddCardPanel } from '@/components/Collection/AddCardPanel';
import { COLLECTION_EDIT_OVERLAY_Z_INDEX } from '@/components/Collection/collectionEditZIndex';
import { RaritySwatch } from '@/components/Collection/RaritySwatch';
import { SetSymbol } from '@/components/Collection/SetSymbol';
import { SortableTh } from '@/components/Collection/SortableTh';
import { fetchCardSets } from '@/lib/collection/api';
import { collectionKeys } from '@/lib/collection/query-keys';
import { fetchWishlist } from '@/lib/wishlist/api';
import {
  isWishlistFinish,
  WISHLIST_FINISHES,
  type WishlistFinish,
  wishlistFinishLabel,
} from '@/lib/wishlist/finish';
import { wishlistKeys } from '@/lib/wishlist/query-keys';
import type { WishlistCard, WishlistSort } from '@/lib/wishlist/types';
import { formatMoney } from '@/utils/formatMoney';
import { WishlistCardRow } from './WishlistCardRow';
import { WishlistEditModal } from './WishlistEditModal';
import { WishlistRow } from './WishlistRow';

const RARITY_OPTIONS = [
  { value: '', label: 'All rarities' },
  { value: 'C', label: 'Common' },
  { value: 'U', label: 'Uncommon' },
  { value: 'R', label: 'Rare' },
  { value: 'M', label: 'Mythic' },
  { value: 'S', label: 'Special' },
];

const FINISH_FILTER_OPTIONS = [
  { value: '', label: 'All finishes' },
  ...WISHLIST_FINISHES.map((finish) => ({ value: finish, label: wishlistFinishLabel(finish) })),
];

const SORT_OPTIONS: { value: WishlistSort; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'setname', label: 'Set' },
  { value: 'rarity', label: 'Rarity' },
  { value: 'quantity', label: 'Qty' },
  { value: 'finish', label: 'Finish' },
  { value: 'price', label: 'Price' },
  { value: 'added', label: 'Date added' },
];

const EMPTY_TEXT = 'Your wishlist is empty. Add cards that you want but do not own.';

export function WishlistView() {
  const [adding, setAdding] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<WishlistSort>('name');
  const [sortDesc, setSortDesc] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [filterSet, setFilterSet] = useState<string | null>(null);
  const [filterRarity, setFilterRarity] = useState<string | null>(null);
  const [filterFinish, setFilterFinish] = useState<WishlistFinish | null>(null);
  const [preview, setPreview] = useState<CardPreviewDetails | null>(null);
  const [editing, setEditing] = useState<WishlistCard | null>(null);
  const isMobile = useMediaQuery('(max-width: 48.75rem)', false);

  const wishlistParams = {
    page,
    sort,
    sortDesc,
    filterSearch: debouncedSearch || undefined,
    filterSet,
    filterRarity,
    filterFinish,
  };

  const setsQuery = useQuery({
    queryKey: collectionKeys.sets(),
    queryFn: fetchCardSets,
  });

  const wishlistQuery = useQuery({
    queryKey: wishlistKeys.list(wishlistParams),
    queryFn: () => fetchWishlist(wishlistParams),
    placeholderData: keepPreviousData,
  });

  const data = wishlistQuery.data;
  const loading = wishlistQuery.isPending && !data;
  const error = wishlistQuery.error?.message ?? null;

  const toggleSort = (column: WishlistSort) => {
    if (sort === column) {
      setSortDesc((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(column);
      setSortDesc('asc');
    }
    setPage(1);
  };

  const sortIndicator = (column: WishlistSort) => {
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

  const handlePreview = (c: WishlistCard) => setPreview(previewFromWishlistCard(c));

  const handleMobileSortChange = (value: string | null) => {
    if (!value) return;
    setSort(value as WishlistSort);
    setSortDesc('asc');
    setPage(1);
  };

  const filterFields = (
    <>
      <TextInput
        data-testid="wishlist-search"
        placeholder="Search wishlist…"
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
      <Select
        placeholder="Filter by finish"
        data={FINISH_FILTER_OPTIONS}
        value={filterFinish ?? ''}
        allowDeselect={false}
        onChange={(v) => {
          setFilterFinish(isWishlistFinish(v) ? v : null);
          setPage(1);
        }}
      />
    </>
  );

  const addPanel = (
    <AddCardPanel
      target="wishlist"
      variant="overlay"
      showHeader={false}
      onClose={() => setAdding(false)}
    />
  );

  return (
    <Stack data-testid="wishlist-view" gap="xs">
      {isMobile ? (
        <Drawer
          opened={adding}
          onClose={() => setAdding(false)}
          position="bottom"
          title="Add to wishlist"
          padding="md"
          size="100%"
          zIndex={COLLECTION_EDIT_OVERLAY_Z_INDEX}
        >
          {addPanel}
        </Drawer>
      ) : (
        <Modal
          opened={adding}
          onClose={() => setAdding(false)}
          title="Add to wishlist"
          size="xl"
          centered
          padding="md"
          zIndex={COLLECTION_EDIT_OVERLAY_Z_INDEX}
        >
          {addPanel}
        </Modal>
      )}

      <WishlistEditModal
        card={editing}
        onClose={() => setEditing(null)}
        zIndex={COLLECTION_EDIT_OVERLAY_Z_INDEX}
      />

      <Box mb="xs">
        <Title order={3}>Wishlist</Title>
        <Text size="sm" c="dimmed">
          Cards that you want but do not own. They do not count toward your collection or its value.
        </Text>
      </Box>

      <Stack mb="xs" gap="xs" hiddenFrom="sm">
        {filterFields}
        <Button
          fullWidth
          leftSection={<PlusIcon size={16} />}
          onClick={() => setAdding(true)}
          data-testid="wishlist-add-cards"
        >
          Add to wishlist
        </Button>
      </Stack>

      <Group
        mb="xs"
        justify="space-between"
        align="flex-end"
        wrap="wrap"
        gap="xs"
        visibleFrom="sm"
        data-testid="wishlist-desktop-toolbar"
      >
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
          <Button
            leftSection={<PlusIcon size={16} />}
            onClick={() => setAdding(true)}
            data-testid="wishlist-add-cards"
          >
            Add to wishlist
          </Button>
        </Box>
      </Group>

      {data && (
        <Group mb="xs" justify="space-between">
          <Badge size="lg" variant="light">
            {formatMoney(data.totalPrice, data.currencyCode)} est. | {data.total} wanted
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
                {EMPTY_TEXT}
              </Text>
            ) : (
              <Stack gap={0}>
                {data.cards.map((card, index) => (
                  <WishlistCardRow
                    key={card.wishlistPrintingId}
                    card={card}
                    striped={index % 2 === 1}
                    onPreview={handlePreview}
                    onEdit={setEditing}
                  />
                ))}
              </Stack>
            )}
          </Box>

          <Box visibleFrom="sm" data-testid="wishlist-desktop-table">
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
                      label="Want"
                      onSort={toggleSort}
                      indicator={sortIndicator}
                    />
                    <SortableTh
                      column="finish"
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
                          {EMPTY_TEXT}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    data.cards.map((card) => (
                      <WishlistRow
                        key={card.wishlistPrintingId}
                        card={card}
                        onPreview={handlePreview}
                        onEdit={setEditing}
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
    </Stack>
  );
}
