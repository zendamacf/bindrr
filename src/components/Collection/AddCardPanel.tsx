'use client';

import { Button, Checkbox, Group, Paper, Table, Text, TextInput, Title } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/MagnifyingGlass';
import { useMemo, useState } from 'react';
import { filterMockSearchResults } from '@/lib/collection/mockSearchResults';
import type { CardSearchResult } from '@/lib/collection/types';
import { CardSearchRow } from './CardSearchRow';

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
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [foil, setFoil] = useState(false);

  const trimmedSearch = debouncedSearch.trim();
  const queryLongEnough = trimmedSearch.length >= MIN_QUERY_LENGTH;

  // TODO: replace with search API once available
  const results = useMemo(
    () => (queryLongEnough ? filterMockSearchResults(trimmedSearch) : []),
    [queryLongEnough, trimmedSearch],
  );

  const handleAdd = (result: CardSearchResult) => {
    const label = foil ? `Foil ${result.name}` : result.name;
    notifications.show({
      message: `Added ${label} successfully.`,
      color: 'green',
    });
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

      <TextInput
        mb={showHeaderResolved ? 'sm' : 'xs'}
        placeholder="Search for a card to add…"
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        leftSection={<MagnifyingGlassIcon size={16} />}
        autoFocus
      />

      {!queryLongEnough && trimmedSearch.length > 0 && (
        <Text c="dimmed" size="sm" mb="sm">
          Type at least {MIN_QUERY_LENGTH} characters to search.
        </Text>
      )}

      {queryLongEnough && (
        <>
          <Table striped highlightOnHover mb="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={48} />
                <Table.Th w={48} />
                <Table.Th>Name</Table.Th>
                <Table.Th>Set</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {results.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Text ta="center" c="dimmed" py="lg">
                      No cards found.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                results.map((result) => (
                  <CardSearchRow key={result.printingId} result={result} onAdd={handleAdd} />
                ))
              )}
            </Table.Tbody>
          </Table>

          <Group justify="space-between">
            <Checkbox
              label="Foil"
              checked={foil}
              onChange={(e) => setFoil(e.currentTarget.checked)}
            />
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
