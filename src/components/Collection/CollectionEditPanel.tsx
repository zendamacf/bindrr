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
import type { CollectionEditState } from './useCollectionEdit';

function CardSummary({ item }: { item: CollectionItemDetail }) {
  const priceLabel = formatMoney(item.price, item.currencyCode);

  return (
    <Stack gap="sm" align="center">
      {item.imageUrl && (
        <FinishCardImage
          src={item.imageUrl}
          width={290}
          height={400}
          foil={item.foil}
          etched={item.etched}
          objectFit="contain"
        />
      )}
      <Group gap="xl" wrap="nowrap">
        <Text size="sm">{item.rarity ?? '—'}</Text>
        <Text size="sm" fw={600}>
          {priceLabel ?? '—'} each
        </Text>
      </Group>
    </Stack>
  );
}

function CardSummarySkeleton() {
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
      style={{ flex: 1, maxWidth: 140 }}
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
          style={{ flex: 1, maxWidth: 180 }}
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

function EditFields({ edit }: { edit: CollectionEditState }) {
  return (
    <>
      <Divider my="md" />
      <Group align="flex-end" gap="md" wrap="nowrap">
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

function EditFieldsSkeleton() {
  return (
    <>
      <Divider my="md" />
      <Group align="flex-end" gap="md" wrap="nowrap">
        <Skeleton height={36} width={180} radius="sm" style={{ flex: 1, maxWidth: 180 }} />
        <Skeleton height={36} width={140} radius="sm" style={{ flex: 1, maxWidth: 140 }} />
      </Group>
    </>
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
          <EditFieldsSkeleton />
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

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
        <Stack gap="md">
          <CardSummary item={item} />
          <Box hiddenFrom="sm">
            {scryfallDetails}
            <EditFields edit={edit} />
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

function EditFooterSkeleton() {
  return (
    <Group justify="space-between" wrap="wrap" gap="sm">
      <Skeleton height={36} width={140} radius="sm" />
      <Group justify="flex-end" gap="sm" wrap="wrap">
        <Skeleton height={36} width={200} radius="sm" />
        <Skeleton height={36} width={72} radius="sm" />
      </Group>
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
          disabled={!edit.hasChanges || edit.busy}
        >
          Save
        </Button>
      </Group>
    </Group>
  );
}
