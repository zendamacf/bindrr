import { Group, Table } from '@mantine/core';
import { CardThumbnail } from '@/components/Card';
import type { CollectionCard } from '@/lib/collection/types';
import { formatMoney } from '@/utils/formatMoney';
import { FinishLabel } from './FinishLabel';
import { LanguageBadge } from './LanguageBadge';
import { PriceTrendBadge } from './PriceTrendBadge';
import { RaritySwatch } from './RaritySwatch';

type CollectionRowProps = {
  card: CollectionCard;
  onEdit: (card: CollectionCard) => void;
};

export const CollectionRow = ({ card, onEdit }: CollectionRowProps) => {
  const priceLabel = formatMoney(card.price, card.currencyCode);

  return (
    <Table.Tr
      data-testid="collection-row"
      style={{ cursor: 'pointer' }}
      onClick={() => onEdit(card)}
    >
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          {card.imageUrl && (
            <CardThumbnail
              imageUrl={card.imageUrl}
              altLabel={card.name}
              foil={card.foil}
              etched={card.etched}
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
        {(card.foil || card.etched) && <FinishLabel foil={card.foil} etched={card.etched} />}
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <span className="numeric" style={{ fontWeight: 600 }}>
            {priceLabel ?? '—'}
          </span>
          <PriceTrendBadge trend={card.priceTrend} />
        </Group>
      </Table.Td>
    </Table.Tr>
  );
};
