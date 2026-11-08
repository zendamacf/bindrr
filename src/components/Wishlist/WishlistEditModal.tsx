'use client';

import { Button, Group, Modal, NumberInput, Select, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ArrowRightIcon } from '@phosphor-icons/react/ArrowRight';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { COLLECTION_EDIT_DROPDOWN_Z_INDEX } from '@/components/Collection/collectionEditZIndex';
import { trackUmamiEvent } from '@/lib/analytics/trackUmamiEvent';
import { umamiEvents } from '@/lib/analytics/umamiEvents';
import { type CardFinish, finishLabelForFinish } from '@/lib/collection/finish';
import { collectionKeys } from '@/lib/collection/query-keys';
import { moveWishlistCard, removeWishlistCard, updateWishlistCard } from '@/lib/wishlist/api';
import {
  isWishlistFinish,
  WISHLIST_FINISHES,
  type WishlistFinish,
  wishlistFinishLabel,
} from '@/lib/wishlist/finish';
import { availableMoveFinishes, defaultMoveFinish } from '@/lib/wishlist/moveFinish';
import { wishlistKeys } from '@/lib/wishlist/query-keys';
import type { WishlistCard } from '@/lib/wishlist/types';

const FINISH_OPTIONS = WISHLIST_FINISHES.map((finish) => ({
  value: finish,
  label: wishlistFinishLabel(finish),
}));

const comboboxProps = { withinPortal: true, zIndex: COLLECTION_EDIT_DROPDOWN_Z_INDEX } as const;

function WishlistMoveForm({
  card,
  onBack,
  onDone,
}: {
  card: WishlistCard;
  onBack: () => void;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const finishChoices = availableMoveFinishes(card);
  const [quantity, setQuantity] = useState<number>(card.quantity);
  const [finish, setFinish] = useState<CardFinish | null>(defaultMoveFinish(card));

  const move = useMutation({
    mutationFn: () => {
      if (finish == null) throw new Error('Choose a finish.');
      return moveWishlistCard(card.wishlistPrintingId, { finish, quantity });
    },
    onSuccess: (result) => {
      notifications.show({
        message: `Moved ${result.moved ?? quantity} × ${card.name} to your collection.`,
        color: 'green',
      });
      trackUmamiEvent(umamiEvents.wishlistMove, { finish });
      void qc.invalidateQueries({ queryKey: wishlistKeys.all });
      void qc.invalidateQueries({ queryKey: collectionKeys.all });
      onDone();
    },
    onError: (error: Error) => notifications.show({ message: error.message, color: 'red' }),
  });

  const remaining = card.quantity - quantity;
  const canMove = finish != null && quantity >= 1 && quantity <= card.quantity;

  return (
    <Stack gap="md" data-testid="wishlist-move-form">
      <Text fw={600}>Move to collection</Text>
      <Text size="sm" c="dimmed">
        {card.setName} ({card.setCode}) · #{card.collectorNumber}
      </Text>
      <NumberInput
        label="Copies that you got"
        description={`You want ${card.quantity}.`}
        min={1}
        max={card.quantity}
        allowDecimal={false}
        allowNegative={false}
        clampBehavior="strict"
        value={quantity}
        onChange={(value) => setQuantity(typeof value === 'number' ? value : card.quantity)}
      />
      <Select
        label="Finish"
        description={
          card.finish === 'any'
            ? 'This item accepts any finish. Choose the finish that you got.'
            : 'Check that this is the finish that you got.'
        }
        placeholder="Choose a finish"
        data={finishChoices.map((choice) => ({
          value: choice,
          label: finishLabelForFinish(choice),
        }))}
        value={finish}
        allowDeselect={false}
        comboboxProps={comboboxProps}
        onChange={(value) => {
          if (value && (finishChoices as string[]).includes(value)) setFinish(value as CardFinish);
        }}
      />
      <Text size="sm" data-testid="wishlist-move-summary">
        {finish == null
          ? 'Choose a finish to continue.'
          : `${quantity} × ${card.name} will be added to your collection as ${finishLabelForFinish(finish)}. ${
              remaining > 0
                ? `${remaining} will stay on your wishlist.`
                : 'The card will be removed from your wishlist.'
            }`}
      </Text>
      <Group justify="flex-end" gap="xs">
        <Button variant="subtle" disabled={move.isPending} onClick={onBack}>
          Back
        </Button>
        <Button loading={move.isPending} disabled={!canMove} onClick={() => move.mutate()}>
          Move to collection
        </Button>
      </Group>
    </Stack>
  );
}

function WishlistEditForm({ card, onClose }: { card: WishlistCard; onClose: () => void }) {
  const qc = useQueryClient();
  const [quantity, setQuantity] = useState<number>(card.quantity);
  const [finish, setFinish] = useState<WishlistFinish>(card.finish);
  const [step, setStep] = useState<'edit' | 'move'>('edit');

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

  if (step === 'move') {
    return <WishlistMoveForm card={card} onBack={() => setStep('edit')} onDone={onClose} />;
  }

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
      <Button
        variant="light"
        color="green"
        fullWidth
        disabled={busy || changed}
        leftSection={<ArrowRightIcon size={16} />}
        onClick={() => setStep('move')}
        data-testid="wishlist-move-start"
      >
        I got this card: move to collection
      </Button>
      {changed && (
        <Text size="xs" c="dimmed" mt={-8}>
          Save your changes before you move this card.
        </Text>
      )}
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
