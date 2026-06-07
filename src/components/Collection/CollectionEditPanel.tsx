'use client';

import {
  Box,
  Button,
  Combobox,
  Divider,
  Group,
  InputBase,
  NumberInput,
  type SelectProps,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  useCombobox,
} from '@mantine/core';
import { FinishCardImage } from '@/components/Card/FinishCardImage';
import { type CardFinish, finishMantineColor } from '@/lib/collection/finish';
import type { CollectionItemDetail } from '@/lib/collection/types';
import { formatMoney } from '@/utils/formatMoney';
import { ChangeHistoryModal } from './ChangeHistoryModal';
import { CollectionScryfallDetails } from './CollectionScryfallDetails';
import { COLLECTION_EDIT_DROPDOWN_Z_INDEX } from './collectionEditZIndex';
import { PriceHistoryModal } from './PriceHistoryModal';
import { PriceTrendBadge } from './PriceTrendBadge';
import { SetSymbol } from './SetSymbol';
import type { CollectionEditState } from './useCollectionEdit';

function CardSummary({ item, compact }: { item: CollectionItemDetail; compact?: boolean }) {
  const priceLabel = formatMoney(item.price, item.currencyCode);

  return (
    <Stack gap="sm" align="center" w="100%" style={{ minWidth: 0 }}>
      {item.imageUrl && (
        <FinishCardImage
          src={item.imageUrl}
          width={290}
          height={400}
          foil={item.foil}
          etched={item.etched}
          objectFit="contain"
          style={{
            width: compact ? '100%' : 290,
            maxWidth: 'min(290px, 100%)',
            flexShrink: 1,
          }}
        />
      )}
      <Group gap="xl" wrap="wrap" justify="center" w="100%" style={{ minWidth: 0 }}>
        <Group gap={6} wrap="wrap" justify="center">
          <SetSymbol setSymbolUrl={item.setSymbolUrl} rarity={item.rarity} />
          <Text size="sm">{item.rarity ?? '—'}</Text>
        </Group>
        <Text size="sm">{item.language}</Text>
        <Group gap="xs" wrap="wrap" align="center" justify="center">
          <Text size="sm" fw={600}>
            {priceLabel ?? '—'}
          </Text>
          <PriceTrendBadge trend={item.priceTrend} />
        </Group>
      </Group>
    </Stack>
  );
}

function CardSummarySkeleton({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <Stack gap="sm" align="center" w="100%" style={{ minWidth: 0 }}>
        <Skeleton width="100%" maw={290} height={400} radius="md" />
        <Stack gap={8} w="100%" maw={290}>
          <Skeleton height={14} width="75%" mx="auto" />
          <Skeleton height={14} width="55%" mx="auto" />
        </Stack>
      </Stack>
    );
  }

  return (
    <Group align="flex-start" wrap="nowrap" gap="md">
      <Skeleton width={100} height={140} radius="md" />
      <Stack gap={8} style={{ flex: 1 }}>
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
      style={{ flex: 1, maxWidth: 140, minWidth: 0 }}
    />
  );
}

function isCardFinish(value: string): value is CardFinish {
  return value === 'nonfoil' || value === 'foil' || value === 'etched';
}

const renderFinishOption = (({ option }) => {
  if (!isCardFinish(option.value)) {
    return <Text span>{option.label}</Text>;
  }

  const color = option.disabled ? 'dimmed' : finishMantineColor(option.value);

  return (
    <Text span c={color}>
      {option.label}
    </Text>
  );
}) satisfies NonNullable<SelectProps['renderOption']>;

function FinishField({
  finish,
  onFinishChange,
  options,
  busy,
  disabled,
}: {
  finish: CardFinish;
  onFinishChange: (value: CardFinish) => void;
  options: CollectionEditState['finishOptions'];
  busy: boolean;
  disabled?: boolean;
}) {
  const fieldDisabled = busy || disabled || options.every((o) => o.disabled);
  const selectedOption = options.find((o) => o.value === finish);
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  return (
    <Combobox
      store={combobox}
      withinPortal
      zIndex={COLLECTION_EDIT_DROPDOWN_Z_INDEX}
      onOptionSubmit={(value) => {
        if (isCardFinish(value)) {
          onFinishChange(value);
          combobox.closeDropdown();
        }
      }}
    >
      <Combobox.Target>
        <InputBase
          component="button"
          type="button"
          pointer
          label="Finish"
          disabled={fieldDisabled}
          onClick={() => combobox.toggleDropdown()}
          rightSection={<Combobox.Chevron />}
          rightSectionPointerEvents="none"
          style={{ flex: 1, maxWidth: 180, minWidth: 0 }}
        >
          {selectedOption ? renderFinishOption({ option: selectedOption, checked: true }) : null}
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
          {options.map((option) => (
            <Combobox.Option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              active={option.value === finish}
            >
              {renderFinishOption({ option, checked: option.value === finish })}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}

function EditFields({ edit, wrapFields }: { edit: CollectionEditState; wrapFields?: boolean }) {
  return (
    <>
      <Divider my="md" />
      <Group align="flex-end" gap="md" wrap={wrapFields ? 'wrap' : 'nowrap'}>
        <FinishField
          finish={edit.finish}
          onFinishChange={edit.setFinish}
          options={edit.finishOptions}
          busy={edit.busy}
        />
        <QuantityField
          quantity={edit.quantity}
          onQuantityChange={edit.setQuantity}
          busy={edit.busy}
        />
      </Group>
    </>
  );
}

function EditFieldsSkeleton({ wrapFields }: { wrapFields?: boolean }) {
  return (
    <>
      <Divider my="md" />
      <Group align="flex-end" gap="md" wrap={wrapFields ? 'wrap' : 'nowrap'}>
        <Skeleton height={36} width={180} radius="sm" style={{ flex: 1, maxWidth: 180 }} />
        <Skeleton height={36} width={140} radius="sm" style={{ flex: 1, maxWidth: 140 }} />
      </Group>
    </>
  );
}

function EditBodySkeleton({ compact }: { compact?: boolean }) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
      <Stack gap="md" style={{ minWidth: 0 }}>
        <CardSummarySkeleton compact={compact} />
        <Stack gap="xs" mih={88}>
          <Skeleton height={14} width="75%" />
          <Skeleton height={14} width="60%" />
          <Skeleton height={14} width="65%" />
          <Skeleton height={14} width="45%" />
        </Stack>
        <Box hiddenFrom="sm">
          <EditFieldsSkeleton wrapFields={compact} />
        </Box>
      </Stack>
      <Box visibleFrom="sm">
        <EditFieldsSkeleton />
      </Box>
    </SimpleGrid>
  );
}

type CollectionEditBodyProps = {
  edit: CollectionEditState;
  compact?: boolean;
};

export function CollectionEditBody({ edit, compact }: CollectionEditBodyProps) {
  if (edit.isPending) {
    return <EditBodySkeleton compact={compact} />;
  }

  if (edit.error || !edit.item) {
    return (
      <Text c="red" ta="center" py="lg">
        {edit.error?.message ?? 'Could not load card.'}
      </Text>
    );
  }

  const item = edit.item;

  const scryfallDetails = (
    <CollectionScryfallDetails
      collectionPrintingId={edit.collectionPrintingId}
      scryfallId={item.scryfallId}
    />
  );

  return (
    <>
      <ChangeHistoryModal
        opened={edit.historyOpen}
        onClose={() => edit.setHistoryOpen(false)}
        history={item.history}
      />
      <PriceHistoryModal
        opened={edit.priceHistoryOpen}
        onClose={() => edit.setPriceHistoryOpen(false)}
        collectionPrintingId={edit.collectionPrintingId}
        currentFinish={edit.finish}
      />

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
        <Stack gap="md" style={{ minWidth: 0 }}>
          <CardSummary item={item} compact={compact} />
          <Box hiddenFrom="sm">
            {scryfallDetails}
            <EditFields edit={edit} wrapFields />
          </Box>
        </Stack>

        <Box visibleFrom="sm">
          {scryfallDetails}
          <EditFields edit={edit} />
        </Box>
      </SimpleGrid>
    </>
  );
}

function EditFooterSkeleton({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <Stack gap="sm" w="100%">
        <Group gap="sm" wrap="wrap">
          <Skeleton height={36} width={140} radius="sm" />
          <Skeleton height={36} width={130} radius="sm" />
        </Group>
        <Group gap="sm" wrap="wrap">
          <Skeleton height={36} width={200} radius="sm" />
          <Skeleton height={36} width={72} radius="sm" />
        </Group>
      </Stack>
    );
  }

  return (
    <Group justify="space-between" wrap="wrap" gap="sm">
      <Group gap="sm" wrap="wrap">
        <Skeleton height={36} width={140} radius="sm" />
        <Skeleton height={36} width={130} radius="sm" />
      </Group>
      <Group justify="flex-end" gap="sm" wrap="wrap">
        <Skeleton height={36} width={200} radius="sm" />
        <Skeleton height={36} width={72} radius="sm" />
      </Group>
    </Group>
  );
}

type CollectionEditFooterProps = {
  edit: CollectionEditState;
  compact?: boolean;
};

export function CollectionEditFooter({ edit, compact }: CollectionEditFooterProps) {
  if (edit.isPending) {
    return <EditFooterSkeleton compact={compact} />;
  }

  if (edit.error || !edit.item) {
    return null;
  }

  const historyCount = edit.item.history.length;

  const historyButtons = compact ? (
    <Group gap="sm" grow>
      <Button
        variant="light"
        onClick={() => edit.setHistoryOpen(true)}
        disabled={edit.busy}
        style={{ flex: 1 }}
      >
        Change history{historyCount > 0 ? ` (${historyCount})` : ''}
      </Button>
      <Button
        variant="light"
        onClick={() => edit.setPriceHistoryOpen(true)}
        disabled={edit.busy}
        style={{ flex: 1 }}
      >
        Price history
      </Button>
    </Group>
  ) : (
    <Group gap="sm" wrap="wrap">
      <Button variant="light" onClick={() => edit.setHistoryOpen(true)} disabled={edit.busy}>
        Change history{historyCount > 0 ? ` (${historyCount})` : ''}
      </Button>
      <Button variant="light" onClick={() => edit.setPriceHistoryOpen(true)} disabled={edit.busy}>
        Price history
      </Button>
    </Group>
  );

  const actionButtons = compact ? (
    <Stack gap="sm">
      <Button
        variant={edit.confirmRemove ? 'filled' : 'light'}
        color="red"
        onClick={edit.handleRemove}
        loading={edit.removeLoading}
        disabled={edit.saveLoading}
        fullWidth
      >
        {edit.confirmRemove ? 'Confirm remove' : 'Remove from collection'}
      </Button>
      <Button
        onClick={edit.handleSave}
        loading={edit.saveLoading}
        disabled={!edit.hasChanges || edit.busy}
        fullWidth
      >
        Save
      </Button>
    </Stack>
  ) : (
    <Group gap="sm" wrap="wrap">
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
        disabled={!edit.hasChanges || edit.busy}
      >
        Save
      </Button>
    </Group>
  );

  if (compact) {
    return (
      <Stack gap="sm" w="100%" style={{ minWidth: 0 }}>
        {historyButtons}
        {actionButtons}
      </Stack>
    );
  }

  return (
    <Group justify="space-between" wrap="wrap" gap="sm">
      {historyButtons}
      {actionButtons}
    </Group>
  );
}
