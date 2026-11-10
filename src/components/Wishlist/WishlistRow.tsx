import { Group, Table } from '@mantine/core';
import { CardThumbnail } from '@/components/Card';
import { LanguageBadge } from '@/components/Collection/LanguageBadge';
import { RaritySwatch } from '@/components/Collection/RaritySwatch';
import { wishlistFinishFlags } from '@/lib/wishlist/finish';
import type { WishlistCard } from '@/lib/wishlist/types';
import { WishlistFinishLabel } from './WishlistFinishLabel';
import { wishlistPriceLabel } from './wishlistPrice';

type WishlistRowProps = {
  card: WishlistCard;
  onEdit: (card: WishlistCard) => void;
};

export function WishlistRow({ card, onEdit }: WishlistRowProps) {
  const { foil, etched } = wishlistFinishFlags(card.finish);

  return (
    <Table.Tr data-testid="wishlist-row" style={{ cursor: 'pointer' }} onClick={() => onEdit(card)}>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          {card.imageUrl && (
            <CardThumbnail
              imageUrl={card.imageUrl}
              altLabel={card.name}
              foil={foil}
              etched={etched}
            />
          )}
          <span>{card.name}</span>
          <LanguageBadge languageCode={card.languageCode} />
        </Group>
      </Table.Td>
      <Table.Td>
        {card.setName} ({card.setCode})
      </Table.Td>
      <Table.Td>
        <Group gap={6} wrap="nowrap">
          <RaritySwatch rarityCode={card.rarity?.charAt(0) ?? null} size={14} />
          <span>{card.rarity ?? '—'}</span>
        </Group>
      </Table.Td>
      <Table.Td>{card.quantity}</Table.Td>
      <Table.Td>
        <WishlistFinishLabel finish={card.finish} />
      </Table.Td>
      <Table.Td>
        <span className="numeric" style={{ fontWeight: 600 }}>
          {wishlistPriceLabel(card)}
        </span>
      </Table.Td>
    </Table.Tr>
  );
}
