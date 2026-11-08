import { Group, Table } from '@mantine/core';
import { CardThumbnail } from '@/components/Card';
import { LanguageBadge } from '@/components/Collection/LanguageBadge';
import { wishlistFinishFlags } from '@/lib/wishlist/finish';
import type { WishlistCard } from '@/lib/wishlist/types';
import { WishlistFinishLabel } from './WishlistFinishLabel';
import { wishlistPriceLabel } from './wishlistPrice';

type WishlistRowProps = {
  card: WishlistCard;
  onPreview: (card: WishlistCard) => void;
  onEdit: (card: WishlistCard) => void;
};

export function WishlistRow({ card, onPreview, onEdit }: WishlistRowProps) {
  const { foil, etched } = wishlistFinishFlags(card.finish);

  return (
    <Table.Tr data-testid="wishlist-row" style={{ cursor: 'pointer' }} onClick={() => onEdit(card)}>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          {card.imageUrl && (
            <CardThumbnail
              imageUrl={card.imageUrl}
              altLabel={card.name}
              stopPropagation
              foil={foil}
              etched={etched}
              onPreview={() => onPreview(card)}
            />
          )}
          <span>{card.name}</span>
          <LanguageBadge languageCode={card.languageCode} />
        </Group>
      </Table.Td>
      <Table.Td>
        {card.setName} ({card.setCode})
      </Table.Td>
      <Table.Td>{card.rarity ?? '—'}</Table.Td>
      <Table.Td>{card.quantity}</Table.Td>
      <Table.Td>
        <WishlistFinishLabel finish={card.finish} />
      </Table.Td>
      <Table.Td>{wishlistPriceLabel(card)}</Table.Td>
    </Table.Tr>
  );
}
