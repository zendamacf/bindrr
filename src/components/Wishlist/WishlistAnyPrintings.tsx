'use client';

import {
  ActionIcon,
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { TrashIcon } from '@phosphor-icons/react/Trash';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { COLLECTION_EDIT_DROPDOWN_Z_INDEX } from '@/components/Collection/collectionEditZIndex';
import { LanguageBadge } from '@/components/Collection/LanguageBadge';
import { trackUmamiEvent } from '@/lib/analytics/trackUmamiEvent';
import { umamiEvents } from '@/lib/analytics/umamiEvents';
import { finishLabelForFinish } from '@/lib/collection/finish';
import { fetchWishlistAny, removeWishlistAnyCard, updateWishlistAnyCard } from '@/lib/wishlist/api';
import {
  isWishlistFinish,
  WISHLIST_FINISHES,
  type WishlistFinish,
  wishlistFinishLabel,
} from '@/lib/wishlist/finish';
import { wishlistKeys } from '@/lib/wishlist/query-keys';
import type { WishlistAnyCard } from '@/lib/wishlist/types';
import { formatMoney } from '@/utils/formatMoney';
import { WishlistAnyAddModal } from './WishlistAnyAddModal';

const FINISH_OPTIONS = WISHLIST_FINISHES.map((finish) => ({
  value: finish,
  label: wishlistFinishLabel(finish),
}));

const comboboxProps = { withinPortal: true, zIndex: COLLECTION_EDIT_DROPDOWN_Z_INDEX } as const;

function AnyPrintingRow({
  card,
  onUpdate,
  onRemove,
  onAdd,
}: {
  card: WishlistAnyCard;
  onUpdate: (id: number, patch: { quantity?: number; finish?: WishlistFinish }) => void;
  onRemove: (id: number) => void;
  onAdd: (card: WishlistAnyCard) => void;
}) {
  const { cheapest } = card;
  const priceLabel = cheapest ? formatMoney(cheapest.price, card.currencyCode) : null;

  return (
    <Table.Tr data-testid="wishlist-any-row">
      <Table.Td>
        <Text fw={500}>{card.name}</Text>
        <Text size="xs" c="dimmed">
          {card.owned} owned · {card.missing} missing
        </Text>
      </Table.Td>
      <Table.Td>
        {cheapest ? (
          <Group gap="xs" wrap="nowrap">
            <Text size="sm">
              {cheapest.setName} ({cheapest.setCode}) #{cheapest.collectorNumber}
            </Text>
            <LanguageBadge languageCode={cheapest.languageCode} />
            {cheapest.finish !== 'nonfoil' && (
              <Text size="xs" c="dimmed">
                {finishLabelForFinish(cheapest.finish)}
              </Text>
            )}
          </Group>
        ) : (
          <Text size="sm" c="dimmed">
            No price yet
          </Text>
        )}
      </Table.Td>
      <Table.Td ta="right">
        <Text fw={600}>{priceLabel ?? '—'}</Text>
      </Table.Td>
      <Table.Td w={90}>
        <NumberInput
          aria-label={`Wanted copies of ${card.name}`}
          size="xs"
          min={1}
          allowDecimal={false}
          clampBehavior="strict"
          value={card.quantity}
          onChange={(v) => {
            if (typeof v === 'number' && v >= 1 && v !== card.quantity) {
              onUpdate(card.wishlistCardId, { quantity: v });
            }
          }}
        />
      </Table.Td>
      <Table.Td w={140}>
        <Select
          aria-label={`Finish of ${card.name}`}
          size="xs"
          data={FINISH_OPTIONS}
          value={card.finish}
          allowDeselect={false}
          comboboxProps={comboboxProps}
          onChange={(v) => {
            if (isWishlistFinish(v)) onUpdate(card.wishlistCardId, { finish: v });
          }}
        />
      </Table.Td>
      <Table.Td>
        <Button size="compact-xs" variant="light" onClick={() => onAdd(card)}>
          Add to collection
        </Button>
      </Table.Td>
      <Table.Td w={40}>
        <ActionIcon
          variant="subtle"
          color="red"
          aria-label={`Remove ${card.name}`}
          onClick={() => onRemove(card.wishlistCardId)}
        >
          <TrashIcon size={16} />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  );
}

/** Cards on the wishlist that the user wants in any printing. Renders nothing when there are none. */
export function WishlistAnyPrintings() {
  const qc = useQueryClient();
  const [adding, setAdding] = useState<WishlistAnyCard | null>(null);
  const query = useQuery({ queryKey: wishlistKeys.any(), queryFn: fetchWishlistAny });

  const onError = (e: Error) => notifications.show({ message: e.message, color: 'red' });
  const refresh = () => void qc.invalidateQueries({ queryKey: wishlistKeys.any() });

  const update = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: number;
      patch: { quantity?: number; finish?: WishlistFinish };
    }) => updateWishlistAnyCard(id, patch),
    onSuccess: () => {
      trackUmamiEvent(umamiEvents.wishlistUpdate, { mode: 'any-printing' });
      refresh();
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: (id: number) => removeWishlistAnyCard(id),
    onSuccess: () => {
      trackUmamiEvent(umamiEvents.wishlistRemove, { mode: 'any-printing' });
      refresh();
    },
    onError,
  });

  const data = query.data;
  if (!data || data.cards.length === 0) return null;

  return (
    <Stack gap="xs" mb="xl" data-testid="wishlist-any">
      <WishlistAnyAddModal card={adding} onClose={() => setAdding(null)} />
      <Group justify="space-between" align="baseline">
        <Title order={3}>Any printing</Title>
        <Text size="sm" c="dimmed">
          Missing copies cost about {formatMoney(data.totalPrice, data.currencyCode)} at the
          cheapest prices.
        </Text>
      </Group>
      <Table.ScrollContainer minWidth={760} type="native">
        <Table verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Card</Table.Th>
              <Table.Th>Cheapest printing</Table.Th>
              <Table.Th ta="right">Price</Table.Th>
              <Table.Th>Want</Table.Th>
              <Table.Th>Finish</Table.Th>
              <Table.Th />
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.cards.map((card) => (
              <AnyPrintingRow
                key={card.wishlistCardId}
                card={card}
                onUpdate={(id, patch) => update.mutate({ id, patch })}
                onRemove={(id) => remove.mutate(id)}
                onAdd={setAdding}
              />
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  );
}
