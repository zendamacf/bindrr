'use client';

import { Box, Button, Group, NumberInput, SimpleGrid, Skeleton, Stack, Text } from '@mantine/core';
import Image from 'next/image';
import type { CollectionItemDetail } from '@/lib/collection/types';
import { formatMoney } from '@/utils/formatMoney';
import { ChangeHistoryModal } from './ChangeHistoryModal';
import { CollectionScryfallDetails } from './CollectionScryfallDetails';
import { FinishLabel } from './FinishLabel';
import type { CollectionEditState } from './useCollectionEdit';

function CardSummary({ item }: { item: CollectionItemDetail }) {
  const priceLabel = formatMoney(item.price, item.currencyCode);

  return (
    <Group align="flex-start" wrap="nowrap" gap="md">
      {item.imageUrl && (
        <Image
          src={item.imageUrl}
          alt=""
          width={100}
          height={140}
          unoptimized
          style={{ flexShrink: 0, borderRadius: 8, objectFit: 'contain' }}
        />
      )}
      <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
        <Text size="sm" c="dimmed">
          {item.setName} ({item.setCode}) · #{item.collectorNumber}
        </Text>
        <Group gap="xs">
          <Text size="sm">{item.rarity ?? '—'}</Text>
          {(item.foil || item.etched) && <FinishLabel foil={item.foil} etched={item.etched} />}
        </Group>
        <Text size="sm" fw={600}>
          {priceLabel ?? '—'} each
        </Text>
      </Stack>
    </Group>
  );
}

function CardSummarySkeleton() {
  return (
    <Group align="flex-start" wrap="nowrap" gap="md">
      <Skeleton width={100} height={140} radius="md" />
      <Stack gap={8} style={{ flex: 1 }}>
        <Skeleton height={14} width="85%" />
        <Skeleton height={14} width="55%" />
        <Skeleton height={14} width="40%" />
      </Stack>
    </Group>
  );
}

function QuantityField({
  quantity,
  onQuantityChange,
  busy,
  disabled,
}: {
  quantity: number | string;
  onQuantityChange: (value: number | string) => void;
  busy: boolean;
  disabled?: boolean;
}) {
  return (
    <NumberInput
      label="Quantity"
      min={0}
      value={quantity}
      onChange={onQuantityChange}
      disabled={busy || disabled}
      style={{ maxWidth: 140 }}
    />
  );
}

function EditBodySkeleton() {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
      <Stack gap="md">
        <CardSummarySkeleton />
        <Stack gap="xs" mih={88}>
          <Skeleton height={14} width="75%" />
          <Skeleton height={14} width="60%" />
          <Skeleton height={14} width="65%" />
          <Skeleton height={14} width="45%" />
        </Stack>
        <Box hiddenFrom="sm">
          <Skeleton height={36} width={140} radius="sm" />
        </Box>
      </Stack>
      <Box visibleFrom="sm">
        <Skeleton height={36} width={140} radius="sm" />
      </Box>
    </SimpleGrid>
  );
}

type CollectionEditBodyProps = {
  edit: CollectionEditState;
};

export function CollectionEditBody({ edit }: CollectionEditBodyProps) {
  if (edit.isPending) {
    return <EditBodySkeleton />;
  }

  if (edit.error || !edit.item) {
    return (
      <Text c="red" ta="center" py="lg">
        {edit.error?.message ?? 'Could not load card.'}
      </Text>
    );
  }

  const item = edit.item;

  return (
    <>
      <ChangeHistoryModal
        opened={edit.historyOpen}
        onClose={() => edit.setHistoryOpen(false)}
        history={item.history}
      />

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
        <Stack gap="md">
          <CardSummary item={item} />
          <CollectionScryfallDetails
            collectionPrintingId={edit.collectionPrintingId}
            scryfallId={item.scryfallId}
            compact
          />
          <Box hiddenFrom="sm">
            <QuantityField
              quantity={edit.quantity}
              onQuantityChange={edit.setQuantity}
              busy={edit.busy}
            />
          </Box>
        </Stack>

        <Box visibleFrom="sm">
          <QuantityField
            quantity={edit.quantity}
            onQuantityChange={edit.setQuantity}
            busy={edit.busy}
          />
        </Box>
      </SimpleGrid>
    </>
  );
}

function EditFooterSkeleton() {
  return (
    <Group justify="flex-end" gap="sm" wrap="wrap">
      <Skeleton height={36} width={140} radius="sm" />
      <Skeleton height={36} width={200} radius="sm" />
      <Skeleton height={36} width={72} radius="sm" />
    </Group>
  );
}

type CollectionEditFooterProps = {
  edit: CollectionEditState;
};

export function CollectionEditFooter({ edit }: CollectionEditFooterProps) {
  if (edit.isPending) {
    return <EditFooterSkeleton />;
  }

  if (edit.error || !edit.item) {
    return null;
  }

  const historyCount = edit.item.history.length;

  return (
    <Group justify="space-between" wrap="wrap" gap="sm">
      <Button variant="light" onClick={() => edit.setHistoryOpen(true)} disabled={edit.busy}>
        Change history{historyCount > 0 ? ` (${historyCount})` : ''}
      </Button>

      <Group justify="flex-end" gap="sm" wrap="wrap">
        <Button
          variant={edit.confirmRemove ? 'filled' : 'light'}
          color="red"
          onClick={edit.handleRemove}
          loading={edit.removeLoading}
          disabled={edit.saveLoading}
        >
          {edit.confirmRemove ? 'Confirm remove' : 'Remove from collection'}
        </Button>
        <Button
          onClick={edit.handleSave}
          loading={edit.saveLoading}
          disabled={!edit.quantityChanged || edit.busy}
        >
          Save
        </Button>
      </Group>
    </Group>
  );
}
