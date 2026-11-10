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
import { BinderGrid, BinderPocket } from '@/components/Collection/BinderPocket';
import { COLLECTION_EDIT_OVERLAY_Z_INDEX } from '@/components/Collection/collectionEditZIndex';
import { LanguageBadge } from '@/components/Collection/LanguageBadge';
import classes from '@/components/Collection/Listing.module.css';
import { ListingControls } from '@/components/Collection/ListingControls';
import { ListingEmptyState } from '@/components/Collection/ListingEmptyState';
import { RaritySwatch } from '@/components/Collection/RaritySwatch';
import { SetSymbol } from '@/components/Collection/SetSymbol';
import { SortableTh } from '@/components/Collection/SortableTh';
import { useListingView } from '@/components/Collection/useListingView';
import { fetchCardSets } from '@/lib/collection/api';
import { BINDER_PAGE_SIZE, COLLECTION_PAGE_SIZE } from '@/lib/collection/helpers';
import { collectionKeys } from '@/lib/collection/query-keys';
import { fetchWishlist } from '@/lib/wishlist/api';
import {
  isWishlistFinish,
  WISHLIST_FINISHES,
  type WishlistFinish,
  wishlistFinishFlags,
  wishlistFinishLabel,
} from '@/lib/wishlist/finish';
import { wishlistKeys } from '@/lib/wishlist/query-keys';
import type { WishlistCard, WishlistSort } from '@/lib/wishlist/types';
import { formatMoney } from '@/utils/formatMoney';
import { WishlistCardRow } from './WishlistCardRow';
import { WishlistEditModal } from './WishlistEditModal';
import { WishlistFinishLabel } from './WishlistFinishLabel';
import { WishlistRow } from './WishlistRow';
import { wishlistPriceLabel } from './wishlistPrice';

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
  const [view, setView, viewReady] = useListingView();
  const isMobile = useMediaQuery('(max-width: 48.75rem)', false);

  const wishlistParams = {
    page,
    pageSize: view === 'binder' ? BINDER_PAGE_SIZE : COLLECTION_PAGE_SIZE,
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
    enabled: viewReady,
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

  const hasFilters = Boolean(debouncedSearch || filterSet || filterRarity || filterFinish);
  const clearFilters = () => {
    setSearch('');
    setFilterSet(null);
    setFilterRarity(null);
    setFilterFinish(null);
    setPage(1);
  };

  const handleSortChange = (value: WishlistSort) => {
    setSort(value);
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

      <Box mb="md">
        <Title order={2} fz={28}>
          Wishlist
        </Title>
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

        <Group gap="xs" className={classes.toolbarActions}>
          <Button
            leftSection={<PlusIcon size={16} />}
            onClick={() => setAdding(true)}
            data-testid="wishlist-add-cards"
          >
            Add to wishlist
          </Button>
        </Group>
      </Group>

      <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm" mb="sm">
        {data ? (
          <Group align="baseline" gap="sm" data-testid="wishlist-summary">
            <Text className={`${classes.total} numeric`}>
              {formatMoney(data.totalPrice, data.currencyCode)}
            </Text>
            <Text c="dimmed" size="sm">
              est. for {data.total} wanted
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
          onSortChange={handleSortChange}
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
          <CardPreviewModal
            opened={preview != null}
            onClose={() => setPreview(null)}
            preview={preview}
          />

          {data.cards.length === 0 ? (
            <ListingEmptyState
              testId="wishlist-empty"
              title={hasFilters ? 'No cards match these filters' : 'Your wishlist is empty'}
              text={
                hasFilters
                  ? 'Try a different search, set, rarity or finish.'
                  : 'Add cards that you want but do not own. Move them to your collection when you get them.'
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
                    Add to wishlist
                  </Button>
                )
              }
            />
          ) : view === 'binder' ? (
            <BinderGrid key={page} testId="wishlist-binder">
              {data.cards.map((card, index) => {
                const { foil, etched } = wishlistFinishFlags(card.finish);
                return (
                  <BinderPocket
                    key={card.wishlistPrintingId}
                    testId="wishlist-row"
                    name={card.name}
                    imageUrl={card.imageUrl}
                    foil={foil}
                    etched={etched}
                    quantity={card.quantity}
                    rarityCode={card.rarity?.charAt(0) ?? null}
                    setCode={card.setCode}
                    tags={
                      <>
                        <WishlistFinishLabel finish={card.finish} size="xs" />
                        <LanguageBadge languageCode={card.languageCode} />
                      </>
                    }
                    price={wishlistPriceLabel(card)}
                    index={index}
                    onOpen={() => setEditing(card)}
                  />
                );
              })}
            </BinderGrid>
          ) : (
            <>
              <Box hiddenFrom="sm">
                <Stack gap={0}>
                  {data.cards.map((card) => (
                    <WishlistCardRow
                      key={card.wishlistPrintingId}
                      card={card}
                      onPreview={handlePreview}
                      onEdit={setEditing}
                    />
                  ))}
                </Stack>
              </Box>

              <Box visibleFrom="sm" data-testid="wishlist-desktop-table">
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
                      {data.cards.map((card) => (
                        <WishlistRow
                          key={card.wishlistPrintingId}
                          card={card}
                          onPreview={handlePreview}
                          onEdit={setEditing}
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
