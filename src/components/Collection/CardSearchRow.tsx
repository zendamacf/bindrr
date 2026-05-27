import { Button, Group, Stack, Table, Text, Tooltip } from '@mantine/core';
import { PlusIcon } from '@phosphor-icons/react';
import { CardThumbnail } from '@/components/Card';
import { addingKeyForFinish, type CardFinish, finishMantineColor } from '@/lib/collection/finish';
import type { CardSearchResult } from '@/lib/collection/types';
import { formatMoney } from '@/utils/formatMoney';
import { LanguageBadge } from './LanguageBadge';

function formatPrice(amount: number | null, currencyCode: string): string {
  return formatMoney(amount, currencyCode) ?? '—';
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
  const _finishCount = [result.canAddNonfoil, result.canAddFoil, result.canAddEtched].filter(
    Boolean,
  ).length;
  const rowBusy = activeAddingKey?.startsWith(`${result.scryfallId}:`) ?? false;

  const keyFor = (finish: CardFinish) => addingKeyForFinish(result.scryfallId, finish);
  const { currencyCode } = result;

  return (
    <Table.Tr>
      <Table.Td w={112} style={{ verticalAlign: 'middle' }}>
        <Stack gap="sm">
          {result.canAddNonfoil && (
            <Tooltip
              label={`Add non-foil${result.price != null ? ` (${formatPrice(result.price, currencyCode)})` : ''}`}
            >
              <Button
                size="sm"
                variant="default"
                fullWidth
                loading={activeAddingKey === keyFor('nonfoil')}
                disabled={rowBusy && activeAddingKey !== keyFor('nonfoil')}
                onClick={() => void onAdd(result, 'nonfoil')}
                justify="space-between"
                leftSection={<PlusIcon size={16} />}
                rightSection={<span />}
              >
                Non-foil
              </Button>
            </Tooltip>
          )}
          {result.canAddFoil && (
            <Tooltip
              label={`Add foil${result.priceFoil != null ? ` (${formatPrice(result.priceFoil, currencyCode)})` : ''}`}
            >
              <Button
                size="sm"
                variant="filled"
                color={finishMantineColor('foil')}
                fullWidth
                loading={activeAddingKey === keyFor('foil')}
                disabled={rowBusy && activeAddingKey !== keyFor('foil')}
                onClick={() => void onAdd(result, 'foil')}
                justify="space-between"
                leftSection={<PlusIcon size={16} />}
                rightSection={<span />}
              >
                Foil
              </Button>
            </Tooltip>
          )}
          {result.canAddEtched && (
            <Tooltip
              label={`Add etched${
                result.priceEtched != null
                  ? ` (${formatPrice(result.priceEtched, currencyCode)})`
                  : ''
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
                justify="space-between"
                leftSection={<PlusIcon size={16} />}
                rightSection={<span />}
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
          <span>{result.name}</span>
          <LanguageBadge languageCode={result.languageCode} />
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
              {formatPrice(result.price, currencyCode)}
            </Text>
          )}
          {result.canAddFoil && (
            <Text size="xs" c={finishMantineColor('foil')} fw={600}>
              Foil {formatPrice(result.priceFoil, currencyCode)}
            </Text>
          )}
          {result.canAddEtched && (
            <Text size="xs" c={finishMantineColor('etched')} fw={600}>
              Etched {formatPrice(result.priceEtched, currencyCode)}
            </Text>
          )}
        </Stack>
      </Table.Td>
    </Table.Tr>
  );
}
