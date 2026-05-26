import { Button, Group, Stack, Table, Text, Tooltip } from '@mantine/core';
import { CardThumbnail } from '@/components/Card';
import type { CardSearchResult } from '@/lib/collection/types';

function formatUsd(raw: string | null): string {
  if (!raw) return '—';
  const n = Number(raw);
  if (!Number.isFinite(n)) return '—';
  return `$${n.toFixed(2)}`;
}

function addingKey(scryfallId: string, foil: boolean) {
  return `${scryfallId}:${foil}`;
}

type CardSearchRowProps = {
  result: CardSearchResult;
  addingKey: string | null;
  onAdd: (result: CardSearchResult, foil: boolean) => void;
  onPreview: (result: CardSearchResult) => void;
};

export function CardSearchRow({
  result,
  addingKey: activeAddingKey,
  onAdd,
  onPreview,
}: CardSearchRowProps) {
  const rowBusy =
    activeAddingKey === addingKey(result.scryfallId, false) ||
    activeAddingKey === addingKey(result.scryfallId, true);
  const bothFinishes = result.canAddNonfoil && result.canAddFoil;

  return (
    <Table.Tr>
      <Table.Td w={112} style={{ verticalAlign: 'middle' }}>
        <Stack gap="sm">
          {result.canAddNonfoil && (
            <Tooltip
              label={`Add non-foil${result.priceUsd ? ` (${formatUsd(result.priceUsd)})` : ''}`}
            >
              <Button
                size="sm"
                variant="filled"
                color="green"
                fullWidth
                loading={activeAddingKey === addingKey(result.scryfallId, false)}
                disabled={rowBusy && activeAddingKey !== addingKey(result.scryfallId, false)}
                onClick={() => void onAdd(result, false)}
              >
                {bothFinishes ? 'Non-foil' : 'Add'}
              </Button>
            </Tooltip>
          )}
          {result.canAddFoil && (
            <Tooltip
              label={`Add foil${result.priceUsdFoil ? ` (${formatUsd(result.priceUsdFoil)})` : ''}`}
            >
              <Button
                size="sm"
                variant="filled"
                color="violet"
                fullWidth
                loading={activeAddingKey === addingKey(result.scryfallId, true)}
                disabled={rowBusy && activeAddingKey !== addingKey(result.scryfallId, true)}
                onClick={() => void onAdd(result, true)}
              >
                Foil
              </Button>
            </Tooltip>
          )}
        </Stack>
      </Table.Td>
      <Table.Td w={48}>
        {result.imageUrl && (
          <CardThumbnail
            imageUrl={result.imageUrl}
            altLabel={result.name}
            onPreview={() => onPreview(result)}
          />
        )}
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <span>
            {result.name}
            {result.language ? ` (${result.language})` : ''}
          </span>
        </Group>
        <span style={{ opacity: 0.6, fontSize: 'var(--mantine-font-size-sm)' }}>
          #{result.collectorNumber}
        </span>
      </Table.Td>
      <Table.Td visibleFrom="sm">
        {result.setName} ({result.setCode})
      </Table.Td>
      <Table.Td hiddenFrom="sm">{result.setCode}</Table.Td>
      <Table.Td ta="right">
        <Stack gap={0} align="flex-end">
          {result.canAddNonfoil && (
            <Text size="sm" fw={600}>
              {formatUsd(result.priceUsd)}
            </Text>
          )}
          {result.canAddFoil && (
            <Text size="xs" c="dimmed">
              Foil {formatUsd(result.priceUsdFoil)}
            </Text>
          )}
        </Stack>
      </Table.Td>
    </Table.Tr>
  );
}
