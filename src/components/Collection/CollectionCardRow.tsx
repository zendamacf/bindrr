import { Box, Group, Stack, Text } from '@mantine/core';
import { CardThumbnail } from '@/components/Card';
import type { CollectionCard } from '@/lib/collection/types';
import { formatMoney } from '@/utils/formatMoney';
import { FinishLabel } from './FinishLabel';
import { LanguageBadge } from './LanguageBadge';
import { PriceTrendBadge } from './PriceTrendBadge';

type CollectionCardRowProps = {
  card: CollectionCard;
  onPreview: (card: CollectionCard) => void;
  onEdit: (card: CollectionCard) => void;
  striped?: boolean;
};

export function CollectionCardRow({
  card,
  onPreview,
  onEdit,
  striped = false,
}: CollectionCardRowProps) {
  const priceLabel = formatMoney(card.price, card.currencyCode);

  return (
    <Box
      onClick={() => onEdit(card)}
      style={{
        cursor: 'pointer',
        borderBottom: '1px solid var(--mantine-color-default-border)',
        backgroundColor: striped
          ? 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))'
          : undefined,
      }}
      py="xs"
      px="xs"
    >
      <Group gap="sm" wrap="nowrap" align="flex-start" style={{ minWidth: 0 }}>
        {card.imageUrl && (
          <CardThumbnail
            imageUrl={card.imageUrl}
            altLabel={card.name}
            stopPropagation
            foil={card.foil}
            etched={card.etched}
            width={40}
            height={56}
            onPreview={() => onPreview(card)}
          />
        )}
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" justify="space-between" wrap="nowrap" align="center">
            <Text fw={500} lineClamp={1} style={{ flex: 1, minWidth: 0 }}>
              {card.name}
            </Text>
            <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
              <Text size="sm" fw={600}>
                {priceLabel ?? '—'}
              </Text>
              <PriceTrendBadge trend={card.priceTrend} />
            </Group>
          </Group>
          <Group gap={6} wrap="wrap" align="center">
            <Text size="sm" c="dimmed">
              {card.setCode}
            </Text>
            <Text size="sm" c="dimmed">
              ·
            </Text>
            <Text size="sm" c="dimmed">
              {card.rarity ?? '—'}
            </Text>
            <Text size="sm" c="dimmed">
              ·
            </Text>
            <Text size="sm" c="dimmed">
              Qty {card.quantity}
            </Text>
            {(card.foil || card.etched) && (
              <>
                <Text size="sm" c="dimmed">
                  ·
                </Text>
                <FinishLabel foil={card.foil} etched={card.etched} size="sm" />
              </>
            )}
            <LanguageBadge languageCode={card.languageCode} />
          </Group>
        </Stack>
      </Group>
    </Box>
  );
}
