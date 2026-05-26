'use client';

import { Button, Group, Loader, NumberInput, Stack, Table, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import {
  fetchCollectionItem,
  removeCollectionItem,
  updateCollectionItemQuantity,
} from '@/lib/collection/api';
import { collectionKeys } from '@/lib/collection/query-keys';
import { formatMoney } from '@/utils/formatMoney';
import { FinishLabel } from './FinishLabel';

type CollectionEditPanelProps = {
  collectionPrintingId: number;
  onClose: () => void;
  onRemoved: () => void;
};

function formatChange(change: number): string {
  if (change > 0) return `+${change}`;
  return String(change);
}

function formatOccurred(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function CollectionEditPanel({
  collectionPrintingId,
  onClose,
  onRemoved,
}: CollectionEditPanelProps) {
  const qc = useQueryClient();
  const [quantity, setQuantity] = useState<number | string>(1);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const itemQuery = useQuery({
    queryKey: collectionKeys.item(collectionPrintingId),
    queryFn: () => fetchCollectionItem(collectionPrintingId),
  });

  const item = itemQuery.data;

  useEffect(() => {
    if (item) setQuantity(item.quantity);
  }, [item]);

  const invalidateCollection = () => {
    void qc.invalidateQueries({ queryKey: collectionKeys.all });
  };

  const updateMutation = useMutation({
    mutationFn: (nextQuantity: number) =>
      updateCollectionItemQuantity(collectionPrintingId, nextQuantity),
    onSuccess: (result) => {
      if (result.removed) {
        notifications.show({ message: 'Card removed from collection.', color: 'green' });
        invalidateCollection();
        onRemoved();
        return;
      }
      notifications.show({ message: 'Quantity updated.', color: 'green' });
      invalidateCollection();
      void qc.invalidateQueries({ queryKey: collectionKeys.item(collectionPrintingId) });
    },
    onError: (e) => {
      notifications.show({
        message: e instanceof Error ? e.message : 'Failed to update card',
        color: 'red',
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => removeCollectionItem(collectionPrintingId),
    onSuccess: () => {
      notifications.show({ message: 'Card removed from collection.', color: 'green' });
      invalidateCollection();
      onRemoved();
    },
    onError: (e) => {
      notifications.show({
        message: e instanceof Error ? e.message : 'Failed to remove card',
        color: 'red',
      });
    },
  });

  const busy = updateMutation.isPending || removeMutation.isPending;
  const parsedQuantity = typeof quantity === 'number' ? quantity : Number(quantity);
  const quantityValid = Number.isFinite(parsedQuantity) && parsedQuantity >= 0;
  const quantityChanged = item != null && quantityValid && parsedQuantity !== item.quantity;

  const handleSave = () => {
    if (!quantityValid) return;
    updateMutation.mutate(parsedQuantity);
  };

  const handleRemove = () => {
    if (!confirmRemove) {
      setConfirmRemove(true);
      return;
    }
    removeMutation.mutate();
  };

  if (itemQuery.isPending) {
    return (
      <Group justify="center" py="xl">
        <Loader />
      </Group>
    );
  }

  if (itemQuery.error || !item) {
    return (
      <Text c="red" ta="center" py="lg">
        {itemQuery.error?.message ?? 'Could not load card.'}
      </Text>
    );
  }

  const priceLabel = formatMoney(item.price, item.currencyCode);
  const displayName = item.language ? `${item.name} (${item.language})` : item.name;

  return (
    <Stack gap="md">
      <Group align="flex-start" wrap="nowrap" gap="md">
        {item.imageUrl && (
          <Image
            src={item.imageUrl}
            alt=""
            width={120}
            height={168}
            unoptimized
            style={{ flexShrink: 0, borderRadius: 8, objectFit: 'contain' }}
          />
        )}
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Title order={4}>{displayName}</Title>
          <Text size="sm" c="dimmed">
            {item.setName} ({item.setCode}) · #{item.collectorNumber}
          </Text>
          <Text size="sm">{item.rarity ?? '—'}</Text>
          {(item.foil || item.etched) && <FinishLabel foil={item.foil} etched={item.etched} />}
          <Text size="sm" fw={600}>
            {priceLabel ?? '—'} each
          </Text>
        </Stack>
      </Group>

      <NumberInput
        label="Quantity"
        min={0}
        value={quantity}
        onChange={setQuantity}
        disabled={busy}
      />

      <Group>
        <Button onClick={handleSave} loading={updateMutation.isPending} disabled={!quantityChanged}>
          Save
        </Button>
        <Button
          variant={confirmRemove ? 'filled' : 'light'}
          color="red"
          onClick={handleRemove}
          loading={removeMutation.isPending}
          disabled={updateMutation.isPending}
        >
          {confirmRemove ? 'Confirm remove' : 'Remove from collection'}
        </Button>
        <Button variant="subtle" onClick={onClose} disabled={busy}>
          Close
        </Button>
      </Group>

      <Stack gap="xs">
        <Text fw={600} size="sm">
          Change history
        </Text>
        {item.history.length === 0 ? (
          <Text size="sm" c="dimmed">
            No changes recorded yet.
          </Text>
        ) : (
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>When</Table.Th>
                <Table.Th ta="right">Change</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {item.history.map((entry) => (
                <Table.Tr key={entry.id}>
                  <Table.Td>{formatOccurred(entry.occurred)}</Table.Td>
                  <Table.Td
                    ta="right"
                    c={entry.change > 0 ? 'green' : entry.change < 0 ? 'red' : undefined}
                  >
                    {formatChange(entry.change)}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Stack>
    </Stack>
  );
}
