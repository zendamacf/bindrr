import { Group, Table } from '@mantine/core';
import { CardThumbnail } from '@/components/Card';
import type { CollectionCard } from '@/lib/collection/types';
import { formatMoney } from '@/utils/formatMoney';
import { FinishLabel } from './FinishLabel';

type CollectionRowProps = {
  card: CollectionCard;
  onPreview: (card: CollectionCard) => void;
  onEdit: (card: CollectionCard) => void;
};

export const CollectionRow = ({ card, onPreview, onEdit }: CollectionRowProps) => {
  const priceLabel = formatMoney(card.price, card.currencyCode);

  return (
    <Table.Tr style={{ cursor: 'pointer' }} onClick={() => onEdit(card)}>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          {card.imageUrl && (
            <CardThumbnail
              imageUrl={card.imageUrl}
              altLabel={card.name}
              stopPropagation
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
      <Table.Td>
        {(card.foil || card.etched) && <FinishLabel foil={card.foil} etched={card.etched} />}
      </Table.Td>
      <Table.Td>{priceLabel ?? '—'}</Table.Td>
    </Table.Tr>
  );
};
