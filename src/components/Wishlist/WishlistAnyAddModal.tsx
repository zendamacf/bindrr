'use client';

import { Button, Group, Loader, Modal, NumberInput, Select, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  COLLECTION_EDIT_DROPDOWN_Z_INDEX,
  COLLECTION_EDIT_OVERLAY_Z_INDEX,
} from '@/components/Collection/collectionEditZIndex';
import { trackUmamiEvent } from '@/lib/analytics/trackUmamiEvent';
import { umamiEvents } from '@/lib/analytics/umamiEvents';
import { addCollectionCard } from '@/lib/collection/api';
import { type CardFinish, finishLabelForFinish } from '@/lib/collection/finish';
import { collectionKeys } from '@/lib/collection/query-keys';
import { fetchWishlistAnyPrintings } from '@/lib/wishlist/api';
import { wishlistKeys } from '@/lib/wishlist/query-keys';
import type { WishlistAnyCard } from '@/lib/wishlist/types';
import { formatMoney } from '@/utils/formatMoney';

const comboboxProps = { withinPortal: true, zIndex: COLLECTION_EDIT_DROPDOWN_Z_INDEX } as const;

function AddForm({ card, onClose }: { card: WishlistAnyCard; onClose: () => void }) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: wishlistKeys.anyPrintings(card.wishlistCardId),
    queryFn: () => fetchWishlistAnyPrintings(card.wishlistCardId),
  });
  const [scryfallId, setScryfallId] = useState<string | null>(null);
  const [finish, setFinish] = useState<CardFinish | null>(null);
  const [quantity, setQuantity] = useState<number | string>(1);

  const data = query.data;
  const printing = data?.printings.find((p) => p.scryfallId === scryfallId) ?? null;
  const finishChoice = printing?.finishes.find((f) => f.finish === finish) ?? null;
  const quantityValid = typeof quantity === 'number' && Number.isInteger(quantity) && quantity >= 1;

  const add = useMutation({
    mutationFn: () => {
      if (!scryfallId || !finish || typeof quantity !== 'number') {
        throw new Error('Choose a printing, a finish and a quantity.');
      }
      return addCollectionCard({ scryfallId, quantity, finish });
    },
    onSuccess: () => {
      notifications.show({ message: `Added ${card.name} to your collection.`, color: 'green' });
      trackUmamiEvent(umamiEvents.wishlistMove, { finish, mode: 'any-printing' });
      void qc.invalidateQueries({ queryKey: wishlistKeys.all });
      void qc.invalidateQueries({ queryKey: collectionKeys.all });
      onClose();
    },
    onError: (error: Error) => notifications.show({ message: error.message, color: 'red' }),
  });

  if (query.isPending) {
    return (
      <Group justify="center" py="xl">
        <Loader />
      </Group>
    );
  }
  if (!data) {
    return <Text c="red">{query.error?.message ?? 'Failed to load printings.'}</Text>;
  }
  if (data.printings.length === 0) {
    return (
      <Text c="dimmed">
        No known printing matches the finish of this item. Change it and try again.
      </Text>
    );
  }

  return (
    <Stack gap="md" data-testid="wishlist-any-add-form">
      <Text size="sm" c="dimmed">
        Choose the printing that you got. The copies count toward this wishlist item, so it stays on
        your wishlist until you remove it.
      </Text>
      <Select
        label="Printing"
        placeholder="Choose a printing"
        searchable
        data={data.printings.map((p) => ({
          value: p.scryfallId,
          label: `${p.setName} (${p.setCode}) #${p.collectorNumber}${
            p.languageCode === 'en' ? '' : ` · ${p.languageCode.toUpperCase()}`
          }`,
        }))}
        value={scryfallId}
        comboboxProps={comboboxProps}
        onChange={(value) => {
          setScryfallId(value);
          const next = data.printings.find((p) => p.scryfallId === value);
          setFinish(next?.finishes.length === 1 ? next.finishes[0].finish : null);
        }}
      />
      <Select
        label="Finish"
        placeholder="Choose a finish"
        disabled={!printing}
        data={(printing?.finishes ?? []).map((f) => ({
          value: f.finish,
          label: `${finishLabelForFinish(f.finish)}${
            f.price != null ? ` (${formatMoney(f.price, data.currencyCode)})` : ''
          }`,
        }))}
        value={finish}
        allowDeselect={false}
        comboboxProps={comboboxProps}
        onChange={(value) => {
          const choice = printing?.finishes.find((f) => f.finish === value);
          if (choice) setFinish(choice.finish);
        }}
      />
      <NumberInput
        label="Copies that you got"
        min={1}
        allowDecimal={false}
        allowNegative={false}
        clampBehavior="strict"
        value={quantity}
        error={quantityValid ? undefined : 'Enter a whole number of 1 or more.'}
        onChange={setQuantity}
      />
      <Group justify="flex-end" gap="xs">
        <Button variant="subtle" disabled={add.isPending} onClick={onClose}>
          Cancel
        </Button>
        <Button
          loading={add.isPending}
          disabled={!printing || !finishChoice || !quantityValid}
          onClick={() => add.mutate()}
        >
          Add to collection
        </Button>
      </Group>
    </Stack>
  );
}

/** Adds copies of one printing of an any-printing wishlist entry to the collection. */
export function WishlistAnyAddModal({
  card,
  onClose,
}: {
  card: WishlistAnyCard | null;
  onClose: () => void;
}) {
  return (
    <Modal
      opened={card != null}
      onClose={onClose}
      title={card ? `Add ${card.name} to collection` : ''}
      centered
      zIndex={COLLECTION_EDIT_OVERLAY_Z_INDEX}
    >
      {card && <AddForm key={card.wishlistCardId} card={card} onClose={onClose} />}
    </Modal>
  );
}
