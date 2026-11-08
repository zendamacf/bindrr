'use client';

import { Button, Group, Modal, NumberInput, Select, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { COLLECTION_EDIT_DROPDOWN_Z_INDEX } from '@/components/Collection/collectionEditZIndex';
import { trackUmamiEvent } from '@/lib/analytics/trackUmamiEvent';
import { umamiEvents } from '@/lib/analytics/umamiEvents';
import { removeWishlistCard, updateWishlistCard } from '@/lib/wishlist/api';
import {
  isWishlistFinish,
  WISHLIST_FINISHES,
  type WishlistFinish,
  wishlistFinishLabel,
} from '@/lib/wishlist/finish';
import { wishlistKeys } from '@/lib/wishlist/query-keys';
import type { WishlistCard } from '@/lib/wishlist/types';

const FINISH_OPTIONS = WISHLIST_FINISHES.map((finish) => ({
  value: finish,
  label: wishlistFinishLabel(finish),
}));

const comboboxProps = { withinPortal: true, zIndex: COLLECTION_EDIT_DROPDOWN_Z_INDEX } as const;

function WishlistEditForm({ card, onClose }: { card: WishlistCard; onClose: () => void }) {
  const qc = useQueryClient();
  const [quantity, setQuantity] = useState<number>(card.quantity);
  const [finish, setFinish] = useState<WishlistFinish>(card.finish);

  const onError = (error: Error) => notifications.show({ message: error.message, color: 'red' });

  const save = useMutation({
    mutationFn: () =>
      updateWishlistCard(card.wishlistPrintingId, {
        ...(quantity !== card.quantity ? { quantity } : {}),
        ...(finish !== card.finish ? { finish } : {}),
      }),
    onSuccess: () => {
      notifications.show({ message: `Updated ${card.name} on your wishlist.`, color: 'green' });
      trackUmamiEvent(umamiEvents.wishlistUpdate, { finish });
      void qc.invalidateQueries({ queryKey: wishlistKeys.all });
      onClose();
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: () => removeWishlistCard(card.wishlistPrintingId),
    onSuccess: () => {
      notifications.show({ message: `Removed ${card.name} from your wishlist.`, color: 'green' });
      trackUmamiEvent(umamiEvents.wishlistRemove);
      void qc.invalidateQueries({ queryKey: wishlistKeys.all });
      onClose();
    },
    onError,
  });

  const changed = quantity !== card.quantity || finish !== card.finish;
  const busy = save.isPending || remove.isPending;

  return (
    <Stack gap="md" data-testid="wishlist-edit-form">
      <Text size="sm" c="dimmed">
        {card.setName} ({card.setCode}) · #{card.collectorNumber}
      </Text>
      <NumberInput
        label="Copies you want"
        min={1}
        allowDecimal={false}
        allowNegative={false}
        clampBehavior="strict"
        value={quantity}
        onChange={(value) => setQuantity(typeof value === 'number' ? value : card.quantity)}
      />
      <Select
        label="Finish"
        description="Choose “Any finish” if every finish is fine."
        data={FINISH_OPTIONS}
        value={finish}
        allowDeselect={false}
        comboboxProps={comboboxProps}
        onChange={(value) => {
          if (isWishlistFinish(value)) setFinish(value);
        }}
      />
      <Text size="xs" c="dimmed">
        This card is on your wishlist only. It does not count toward your collection.
      </Text>
      <Group justify="space-between">
        <Button
          variant="light"
          color="red"
          loading={remove.isPending}
          disabled={busy}
          onClick={() => remove.mutate()}
        >
          Remove
        </Button>
        <Group gap="xs">
          <Button variant="subtle" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={save.isPending}
            disabled={!changed || remove.isPending}
            onClick={() => save.mutate()}
          >
            Save
          </Button>
        </Group>
      </Group>
    </Stack>
  );
}

type WishlistEditModalProps = {
  card: WishlistCard | null;
  onClose: () => void;
  zIndex: number;
};

export function WishlistEditModal({ card, onClose, zIndex }: WishlistEditModalProps) {
  return (
    <Modal
      opened={card != null}
      onClose={onClose}
      title={card?.name ?? 'Wishlist item'}
      size="sm"
      centered
      padding="md"
      zIndex={zIndex}
    >
      {card && <WishlistEditForm key={card.wishlistPrintingId} card={card} onClose={onClose} />}
    </Modal>
  );
}
