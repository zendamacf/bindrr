import { Group, Table } from '@mantine/core';
import Image from 'next/image';
import type { CollectionCard } from '@/lib/collection/types';
import { formatMoney } from '@/utils/formatMoney';

export const CollectionRow = ({ card }: { card: CollectionCard }) => {
  const priceLabel = formatMoney(card.price, card.currencyCode);

  return (
    <Table.Tr>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          {card.imageUrl && (
            <Image
              src={card.imageUrl}
              alt=""
              width={32}
              height={45}
              unoptimized
              style={{ objectFit: 'cover', borderRadius: 4 }}
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
