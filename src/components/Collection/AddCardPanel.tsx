'use client';

import { Button, Group, Paper, Select, Table, Text, TextInput, Title } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/MagnifyingGlass';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  type CardPreviewDetails,
  CardPreviewModal,
  previewFromSearchResult,
} from '@/components/Card';
import { addCollectionCard, searchCards } from '@/lib/collection/api';
import {
  addingKeyForFinish,
  type CardFinish,
  finishFlags,
  finishLabel,
} from '@/lib/collection/finish';
import { collectionKeys } from '@/lib/collection/query-keys';
import { buildSetFilterOptions } from '@/lib/collection/searchSetFilter';
import type { CardSearchResult } from '@/lib/collection/types';
import {
  DEFAULT_SCRYFALL_LANGUAGE,
  SCRYFALL_LANGUAGES,
  type ScryfallLanguageCode,
} from '@/lib/scryfall/languages';
import { CardSearchRow } from './CardSearchRow';
import { COLLECTION_EDIT_DROPDOWN_Z_INDEX } from './collectionEditZIndex';

const addCardComboboxProps = {
  withinPortal: true,
  zIndex: COLLECTION_EDIT_DROPDOWN_Z_INDEX,
} as const;

const MIN_QUERY_LENGTH = 3;

type AddCardPanelProps = {
  onClose: () => void;
  /** Default: standalone panel in the page. Overlay variant removes the extra Paper chrome/header. */
  variant?: 'page' | 'overlay';
  /** Shows the "Add cards" header and the "Back to collection" button (page variant only). */
  showHeader?: boolean;
};

export function AddCardPanel({ onClose, variant = 'page', showHeader }: AddCardPanelProps) {
  const showHeaderResolved = showHeader ?? variant === 'page';
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [preview, setPreview] = useState<CardPreviewDetails | null>(null);
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [filterSetCode, setFilterSetCode] = useState<string | null>(null);
  const [language, setLanguage] = useState<ScryfallLanguageCode>(DEFAULT_SCRYFALL_LANGUAGE);

  const trimmedSearch = debouncedSearch.trim();
  const queryLongEnough = trimmedSearch.length >= MIN_QUERY_LENGTH;

  const searchQuery = useQuery({
    queryKey: ['cardSearch', trimmedSearch, language],
    queryFn: () => searchCards(trimmedSearch, language),
    enabled: queryLongEnough,
    placeholderData: keepPreviousData,
  });

  const results = searchQuery.data ?? [];

  const setFilterOptions = buildSetFilterOptions(results);

  const filteredResults = filterSetCode
    ? results.filter((r) => r.setCode === filterSetCode)
    : results;

  const showSetFilter = results.length > 0 && setFilterOptions.length > 0;

  const handleAdd = async (result: CardSearchResult, finish: CardFinish) => {
    const key = addingKeyForFinish(result.scryfallId, finish);
    setAddingKey(key);
    try {
      await addCollectionCard({ scryfallId: result.scryfallId, quantity: 1, finish });
      const { foil, etched } = finishFlags(finish);
      const finishPart = finishLabel(foil, etched);
      const label = finish === 'nonfoil' ? result.name : `${finishPart} ${result.name}`;
      notifications.show({
        message: `Added ${label} successfully.`,
        color: 'green',
      });
      void qc.invalidateQueries({ queryKey: collectionKeys.all });
    } catch (e) {
      notifications.show({
        message: e instanceof Error ? e.message : 'Failed to add card',
        color: 'red',
      });
    } finally {
      setAddingKey(null);
    }
  };

  const content = (
    <>
      {showHeaderResolved && (
        <Group justify="space-between" mb="sm" wrap="wrap">
          <Title order={3}>Add cards</Title>
          <Button variant="subtle" onClick={onClose}>
            Back to collection
          </Button>
        </Group>
      )}

      <Group
        gap="xs"
        align="flex-end"
        wrap="nowrap"
        mb={showHeaderResolved ? 'sm' : 'xs'}
        style={{ width: '100%' }}
      >
        <TextInput
          placeholder="Search for a card to add…"
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            setFilterSetCode(null);
          }}
          leftSection={<MagnifyingGlassIcon size={16} />}
          autoFocus
          style={{ flex: 1, minWidth: 0 }}
        />
        <Select
          data={SCRYFALL_LANGUAGES}
          value={language}
          onChange={(value) => {
            if (value) setLanguage(value as ScryfallLanguageCode);
            setFilterSetCode(null);
          }}
          allowDeselect={false}
          comboboxProps={addCardComboboxProps}
          w={200}
        />
      </Group>

      {!queryLongEnough && trimmedSearch.length > 0 && (
        <Text c="dimmed" size="sm" mb="sm">
          Type at least {MIN_QUERY_LENGTH} characters to search.
        </Text>
      )}

      {queryLongEnough && (
        <>
          <CardPreviewModal
            opened={preview != null}
            onClose={() => setPreview(null)}
            preview={preview}
          />

          {showSetFilter && (
            <Select
              key={trimmedSearch}
              mb="sm"
              placeholder="Filter by set"
              clearable
              searchable
              data={setFilterOptions}
              value={filterSetCode}
              onChange={(value) => setFilterSetCode(value)}
              comboboxProps={addCardComboboxProps}
            />
          )}

          <Table striped highlightOnHover mb="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={112}>Add</Table.Th>
                <Table.Th w={48} />
                <Table.Th>Name</Table.Th>
                <Table.Th>Set</Table.Th>
                <Table.Th ta="right">Price</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {searchQuery.isPending && results.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text ta="center" c="dimmed" py="lg">
                      Searching…
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : results.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text ta="center" c="dimmed" py="lg">
                      No cards found.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : filteredResults.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text ta="center" c="dimmed" py="lg">
                      No cards match the selected set.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredResults.map((result) => (
                  <CardSearchRow
                    key={result.scryfallId}
                    result={result}
                    addingKey={addingKey}
                    onAdd={handleAdd}
                    onPreview={(r) => setPreview(previewFromSearchResult(r))}
                  />
                ))
              )}
            </Table.Tbody>
          </Table>

          <Group justify="flex-end">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
          </Group>
        </>
      )}
    </>
  );

  if (variant === 'overlay') return content;

  return (
    <Paper withBorder p="md" radius="md">
      {content}
    </Paper>
  );
}
