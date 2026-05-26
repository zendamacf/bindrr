import { Group, Table } from '@mantine/core';
import { CardThumbnail } from '@/components/Card';
import type { CollectionCard } from '@/lib/collection/types';
import { formatMoney } from '@/utils/formatMoney';

type CollectionRowProps = {
  card: CollectionCard;
  onPreview: (card: CollectionCard) => void;
};

export const CollectionRow = ({ card, onPreview }: CollectionRowProps) => {
  const priceLabel = formatMoney(card.price, card.currencyCode);

  return (
    <Table.Tr>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          {card.imageUrl && (
            <CardThumbnail
              imageUrl={card.imageUrl}
              altLabel={card.name}
              onPreview={() => onPreview(card)}
            />
          )}
          <span>
            {card.name}
            {card.language ? ` (${card.language})` : ''}
          </span>
        </Group>
      </Table.Td>
      <Table.Td>
        {card.setName} ({card.setCode})
      </Table.Td>
      <Table.Td>{card.rarity ?? '—'}</Table.Td>
      <Table.Td>{card.quantity}</Table.Td>
      <Table.Td>{card.foil ? '✓' : ''}</Table.Td>
      <Table.Td>{priceLabel ?? '—'}</Table.Td>
    </Table.Tr>
  );
};
