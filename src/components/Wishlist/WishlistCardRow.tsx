import { Box, Group, Stack, Text } from '@mantine/core';
import { CardThumbnail } from '@/components/Card';
import { LanguageBadge } from '@/components/Collection/LanguageBadge';
import { wishlistFinishFlags } from '@/lib/wishlist/finish';
import type { WishlistCard } from '@/lib/wishlist/types';
import { WishlistFinishLabel } from './WishlistFinishLabel';
import { wishlistPriceLabel } from './wishlistPrice';

type WishlistCardRowProps = {
  card: WishlistCard;
  onEdit: (card: WishlistCard) => void;
};

/** Compact row for small screens. */
export function WishlistCardRow({ card, onEdit }: WishlistCardRowProps) {
  const { foil, etched } = wishlistFinishFlags(card.finish);

  return (
    <Box
      data-testid="wishlist-row"
      onClick={() => onEdit(card)}
      style={{
        cursor: 'pointer',
        borderBottom: '1px solid var(--mantine-color-default-border)',
      }}
      py="xs"
      px="xs"
    >
      <Group gap="sm" wrap="nowrap" align="flex-start" style={{ minWidth: 0 }}>
        {card.imageUrl && (
          <CardThumbnail
            imageUrl={card.imageUrl}
            altLabel={card.name}
            foil={foil}
            etched={etched}
            width={40}
            height={56}
          />
        )}
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" justify="space-between" wrap="nowrap" align="center">
            <Text fw={500} lineClamp={1} style={{ flex: 1, minWidth: 0 }}>
              {card.name}
            </Text>
            <Text size="sm" fw={600} style={{ flexShrink: 0 }}>
              {wishlistPriceLabel(card)}
            </Text>
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
              Want {card.quantity}
            </Text>
            <Text size="sm" c="dimmed">
              ·
            </Text>
            <WishlistFinishLabel finish={card.finish} size="sm" />
            <LanguageBadge languageCode={card.languageCode} />
          </Group>
        </Stack>
      </Group>
    </Box>
  );
}
