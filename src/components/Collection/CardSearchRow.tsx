import { Button, Group, Stack, Table, Text, Tooltip } from '@mantine/core';
import { CardThumbnail } from '@/components/Card';
import {
  addingKeyForFinish,
  finishMantineColor,
  type CardFinish,
} from '@/lib/collection/finish';
import type { CardSearchResult } from '@/lib/collection/types';

function formatUsd(raw: string | null): string {
  if (!raw) return '—';
  const n = Number(raw);
  if (!Number.isFinite(n)) return '—';
  return `$${n.toFixed(2)}`;
}

type CardSearchRowProps = {
  result: CardSearchResult;
  addingKey: string | null;
  onAdd: (result: CardSearchResult, finish: CardFinish) => void;
  onPreview: (result: CardSearchResult) => void;
};

export function CardSearchRow({
  result,
  addingKey: activeAddingKey,
  onAdd,
  onPreview,
}: CardSearchRowProps) {
  const finishCount = [result.canAddNonfoil, result.canAddFoil, result.canAddEtched].filter(
    Boolean,
  ).length;
  const rowBusy = activeAddingKey?.startsWith(`${result.scryfallId}:`) ?? false;

  const keyFor = (finish: CardFinish) => addingKeyForFinish(result.scryfallId, finish);

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
                loading={activeAddingKey === keyFor('nonfoil')}
                disabled={rowBusy && activeAddingKey !== keyFor('nonfoil')}
                onClick={() => void onAdd(result, 'nonfoil')}
              >
                {finishCount > 1 ? 'Non-foil' : 'Add'}
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
                color={finishMantineColor('foil')}
                fullWidth
                loading={activeAddingKey === keyFor('foil')}
                disabled={rowBusy && activeAddingKey !== keyFor('foil')}
                onClick={() => void onAdd(result, 'foil')}
              >
                Foil
              </Button>
            </Tooltip>
          )}
          {result.canAddEtched && (
            <Tooltip
              label={`Add etched${
                result.priceUsdEtched ? ` (${formatUsd(result.priceUsdEtched)})` : ''
              }`}
            >
              <Button
                size="sm"
                variant="filled"
                color={finishMantineColor('etched')}
                fullWidth
                loading={activeAddingKey === keyFor('etched')}
                disabled={rowBusy && activeAddingKey !== keyFor('etched')}
                onClick={() => void onAdd(result, 'etched')}
              >
                Etched
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
            <Text size="xs" c={finishMantineColor('foil')} fw={600}>
              Foil {formatUsd(result.priceUsdFoil)}
            </Text>
          )}
          {result.canAddEtched && (
            <Text size="xs" c={finishMantineColor('etched')} fw={600}>
              Etched {formatUsd(result.priceUsdEtched)}
            </Text>
          )}
        </Stack>
      </Table.Td>
    </Table.Tr>
  );
}
