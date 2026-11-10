import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Combobox,
  Divider,
  Flex,
  Group,
  InputBase,
  Menu,
  NumberInput,
  type SelectProps,
  Skeleton,
  Stack,
  Switch,
  Text,
  UnstyledButton,
  useCombobox,
} from '@mantine/core';
import { CaretLeftIcon } from '@phosphor-icons/react/CaretLeft';
import { CaretRightIcon } from '@phosphor-icons/react/CaretRight';
import { DotsThreeIcon } from '@phosphor-icons/react/DotsThree';
import { MinusIcon } from '@phosphor-icons/react/Minus';
import { PlusIcon } from '@phosphor-icons/react/Plus';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { type FormEvent, useRef, useState } from 'react';
import { FinishCardImage } from '@/components/Card/FinishCardImage';
import { fetchCollectionItemPriceHistory } from '@/lib/collection/api';
import { type CardFinish, finishFromFlags, finishMantineColor } from '@/lib/collection/finish';
import { scryfallCardUrl, tcgplayerProductUrl } from '@/lib/collection/printingLinks';
import { collectionKeys } from '@/lib/collection/query-keys';
import type { CollectionItemDetail } from '@/lib/collection/types';
import { formatMoney } from '@/utils/formatMoney';
import { ChangeHistoryModal } from './ChangeHistoryModal';
import { CollectionScryfallDetails } from './CollectionScryfallDetails';
import { COLLECTION_EDIT_DROPDOWN_Z_INDEX } from './collectionEditZIndex';
import { PriceHistoryModal } from './PriceHistoryModal';
import { PriceTrendBadge } from './PriceTrendBadge';
import { PrintingExternalLinks } from './PrintingExternalLinks';
import { sparklineValues } from './priceHistoryChartUtils';
import { SetSymbol } from './SetSymbol';
import type { CollectionEditState } from './useCollectionEdit';

const Sparkline = dynamic(() => import('@mantine/charts').then((mod) => mod.Sparkline), {
  ssr: false,
  loading: () => <Skeleton height={32} width={96} radius="sm" />,
});

/** Lets the footer's Save button (outside the body) submit the fields' form. */
export const COLLECTION_EDIT_FORM_ID = 'collection-edit-form';

const SPARKLINE_DAYS = 30;

/** Movement beyond this many pixels counts as a tilt drag, not a tap. */
const TAP_SLOP_PX = 10;

export type CollectionEditNav = {
  prevId: number | null;
  nextId: number | null;
  onNavigate: (id: number) => void;
};

export function CardNavButtons({ nav, size = 28 }: { nav: CollectionEditNav; size?: number }) {
  return (
    <Group gap={4} wrap="nowrap">
      <ActionIcon
        variant="subtle"
        color="gray"
        size={size}
        aria-label="Previous card"
        disabled={nav.prevId == null}
        onClick={() => nav.prevId != null && nav.onNavigate(nav.prevId)}
      >
        <CaretLeftIcon size={Math.round(size * 0.65)} />
      </ActionIcon>
      <ActionIcon
        variant="subtle"
        color="gray"
        size={size}
        aria-label="Next card"
        disabled={nav.nextId == null}
        onClick={() => nav.nextId != null && nav.onNavigate(nav.nextId)}
      >
        <CaretRightIcon size={Math.round(size * 0.65)} />
      </ActionIcon>
    </Group>
  );
}

function EffectsSwitch({
  effects,
  onChange,
}: {
  effects: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Switch
      size="xs"
      label="Card effects"
      checked={effects}
      onChange={(e) => onChange(e.currentTarget.checked)}
    />
  );
}

function CardImage({
  item,
  effects,
  width,
  tiltTouch,
}: {
  item: CollectionItemDetail;
  effects: boolean;
  width: number;
  tiltTouch: boolean;
}) {
  if (!item.imageUrl) return null;
  return (
    <FinishCardImage
      src={item.imageUrl}
      width={290}
      height={400}
      foil={effects && item.foil}
      etched={effects && item.etched}
      objectFit="contain"
      tilt={effects ? 18 : undefined}
      tiltTouch={tiltTouch}
      style={{ width, maxWidth: '100%', flexShrink: 0 }}
    />
  );
}

function PriceSummary({ item, edit }: { item: CollectionItemDetail; edit: CollectionEditState }) {
  const priceLabel = formatMoney(item.price, item.currencyCode);
  const savedFinish = finishFromFlags(item.foil, item.etched);

  const historyQuery = useQuery({
    queryKey: collectionKeys.itemPriceHistory(edit.collectionPrintingId, SPARKLINE_DAYS),
    queryFn: () =>
      fetchCollectionItemPriceHistory(edit.collectionPrintingId, { days: SPARKLINE_DAYS }),
  });
  const values = historyQuery.data ? sparklineValues(historyQuery.data, savedFinish) : [];

  return (
    <Group justify="space-between" align="center" wrap="wrap" gap="sm">
      <Stack gap={4} style={{ minWidth: 0 }}>
        <Group gap="xs" align="baseline" wrap="nowrap">
          <Text
            className="numeric"
            fw={700}
            style={{ fontSize: 'var(--mantine-font-size-xl)', lineHeight: 1.1 }}
          >
            {priceLabel ?? '—'}
          </Text>
          <PriceTrendBadge trend={item.priceTrend} />
        </Group>
        <Group gap={6} wrap="nowrap">
          <SetSymbol setSymbolUrl={item.setSymbolUrl} rarity={item.rarity} />
          <Text size="sm" c="dimmed">
            {item.rarity ?? '—'}
          </Text>
        </Group>
      </Stack>
      {values.length >= 2 && (
        <UnstyledButton
          aria-label="View price history"
          onClick={() => edit.setPriceHistoryOpen(true)}
          style={{ flexShrink: 0, borderRadius: 'var(--mantine-radius-sm)' }}
        >
          <Sparkline
            w={96}
            h={32}
            data={values}
            curveType="linear"
            color={
              finishMantineColor(savedFinish) ? `${finishMantineColor(savedFinish)}.6` : 'gray.6'
            }
            fillOpacity={0.12}
            strokeWidth={2}
          />
        </UnstyledButton>
      )}
    </Group>
  );
}

function CardSummarySkeleton({ compact }: { compact?: boolean }) {
  if (compact) {
    return <Skeleton width={150} height={207} radius="md" style={{ flexShrink: 0 }} />;
  }
  return (
    <Stack gap="sm" align="center" w={290} style={{ flexShrink: 0 }}>
      <Skeleton width={290} height={400} radius="md" />
      <Skeleton height={14} width={120} />
    </Stack>
  );
}

function QuantityField({
  quantity,
  onQuantityChange,
  busy,
  compact,
}: {
  quantity: number | string;
  onQuantityChange: (value: number | string) => void;
  busy: boolean;
  compact?: boolean;
}) {
  const controlSize = compact ? 42 : 36;
  const current = typeof quantity === 'number' ? quantity : Number(quantity);
  const base = Number.isFinite(current) ? current : 0;

  return (
    <Box>
      <Text
        component="label"
        htmlFor="collection-edit-quantity"
        size="sm"
        fw={500}
        mb={4}
        display="block"
      >
        Quantity
      </Text>
      <Group gap={6} wrap="nowrap">
        <ActionIcon
          variant="default"
          size={controlSize}
          aria-label="Decrease quantity"
          disabled={busy || base <= 0}
          onClick={() => onQuantityChange(Math.max(0, base - 1))}
        >
          <MinusIcon size={16} />
        </ActionIcon>
        <NumberInput
          id="collection-edit-quantity"
          data-testid="collection-edit-quantity"
          min={0}
          hideControls
          size={compact ? 'lg' : 'sm'}
          allowNegative={false}
          allowDecimal={false}
          value={quantity}
          onChange={onQuantityChange}
          disabled={busy}
          w={64}
          styles={{ input: { textAlign: 'center' } }}
        />
        <ActionIcon
          variant="default"
          size={controlSize}
          aria-label="Increase quantity"
          disabled={busy}
          onClick={() => onQuantityChange(base + 1)}
        >
          <PlusIcon size={16} />
        </ActionIcon>
      </Group>
    </Box>
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
  compact,
}: {
  finish: CardFinish;
  onFinishChange: (value: CardFinish) => void;
  options: CollectionEditState['finishOptions'];
  busy: boolean;
  disabled?: boolean;
  compact?: boolean;
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
          size={compact ? 'lg' : 'sm'}
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

function EditFields({ edit, compact }: { edit: CollectionEditState; compact?: boolean }) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (edit.hasChanges && !edit.busy) edit.handleSave();
  };

  return (
    <form id={COLLECTION_EDIT_FORM_ID} onSubmit={handleSubmit}>
      <Stack gap="sm">
        <Group align="flex-end" gap="md" wrap="wrap">
          <FinishField
            finish={edit.finish}
            onFinishChange={edit.setFinish}
            options={edit.finishOptions}
            busy={edit.busy}
            compact={compact}
          />
          <QuantityField
            quantity={edit.quantity}
            onQuantityChange={edit.setQuantity}
            busy={edit.busy}
            compact={compact}
          />
        </Group>
        {edit.willRemove && (
          <Text size="sm" c="red" role="status">
            Saving with a quantity of 0 removes this card from your collection.
          </Text>
        )}
        {!compact && (
          <Group gap="sm" align="center">
            <SaveButton edit={edit} />
            {edit.hasChanges && !edit.busy && (
              <Badge variant="dot" color="yellow" size="sm" role="status">
                Unsaved changes
              </Badge>
            )}
          </Group>
        )}
      </Stack>
    </form>
  );
}

function SaveButton({
  edit,
  fullWidth,
  size,
}: {
  edit: CollectionEditState;
  fullWidth?: boolean;
  size?: 'md' | 'lg';
}) {
  return (
    <Button
      type="submit"
      form={COLLECTION_EDIT_FORM_ID}
      color={edit.willRemove ? 'red' : undefined}
      loading={edit.saveLoading}
      disabled={!edit.hasChanges || edit.busy}
      fullWidth={fullWidth}
      size={size}
      data-testid="collection-edit-save"
    >
      {edit.willRemove ? 'Remove from collection' : 'Save'}
    </Button>
  );
}

function EditBodySkeleton({ compact }: { compact?: boolean }) {
  return (
    <Flex
      gap="lg"
      direction={{ base: 'column', sm: 'row' }}
      align={{ base: 'stretch', sm: 'flex-start' }}
    >
      <CardSummarySkeleton compact={compact} />
      <Stack gap="md" style={{ flex: 1, minWidth: 0 }}>
        <Skeleton height={34} width="45%" />
        <Group gap="md">
          <Skeleton height={36} width={160} radius="sm" />
          <Skeleton height={36} width={150} radius="sm" />
        </Group>
        <Divider />
        <Stack gap="xs" mih={88}>
          <Skeleton height={14} width="75%" />
          <Skeleton height={14} width="60%" />
          <Skeleton height={14} width="65%" />
          <Skeleton height={14} width="45%" />
        </Stack>
      </Stack>
    </Flex>
  );
}

function EditBodyContent({
  edit,
  item,
  compact,
  nav,
}: {
  edit: CollectionEditState;
  item: CollectionItemDetail;
  compact?: boolean;
  nav?: CollectionEditNav;
}) {
  // Session-only: lets people turn off tilt and the foil/etched overlay if it hinders reading the card.
  const [effects, setEffects] = useState(true);
  // Mobile only: the thumbnail expands to a full-size, tiltable image.
  const [expanded, setExpanded] = useState(false);
  const dragStart = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  const details = (
    <CollectionScryfallDetails
      collectionPrintingId={edit.collectionPrintingId}
      scryfallId={item.scryfallId}
    />
  );

  if (compact) {
    const fields = (
      <>
        <EditFields edit={edit} compact />
        <Divider />
        {details}
      </>
    );

    if (expanded && item.imageUrl) {
      return (
        <Stack gap="md" data-testid="collection-edit-panel">
          <Stack gap="xs" align="center">
            {/* A drag tilts the card; only a tap (little movement) shrinks it. */}
            <UnstyledButton
              aria-label="Shrink card image"
              onPointerDown={(e) => {
                dragStart.current = { x: e.clientX, y: e.clientY, moved: false };
              }}
              onPointerMove={(e) => {
                const start = dragStart.current;
                if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > TAP_SLOP_PX) {
                  start.moved = true;
                }
              }}
              onClick={() => {
                if (!dragStart.current?.moved) setExpanded(false);
              }}
              style={{ lineHeight: 0, maxWidth: '100%' }}
            >
              <CardImage item={item} effects={effects} width={290} tiltTouch />
            </UnstyledButton>
            <EffectsSwitch effects={effects} onChange={setEffects} />
            <Text size="xs" c="dimmed">
              Tap the card to shrink it.
            </Text>
          </Stack>
          <PriceSummary item={item} edit={edit} />
          {fields}
        </Stack>
      );
    }

    return (
      <Stack gap="md" data-testid="collection-edit-panel">
        <Flex gap="md" align="center" wrap="nowrap">
          {item.imageUrl ? (
            <UnstyledButton
              aria-label="Enlarge card image"
              onClick={() => setExpanded(true)}
              style={{ flexShrink: 0, lineHeight: 0 }}
            >
              <CardImage item={item} effects={effects} width={150} tiltTouch={false} />
            </UnstyledButton>
          ) : null}
          <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
            <PriceSummary item={item} edit={edit} />
            {item.imageUrl && (
              <>
                <EffectsSwitch effects={effects} onChange={setEffects} />
                <Text size="xs" c="dimmed">
                  Tap the card to enlarge it.
                </Text>
              </>
            )}
          </Stack>
        </Flex>
        {fields}
      </Stack>
    );
  }

  return (
    <Flex gap="lg" align="flex-start" data-testid="collection-edit-panel">
      <Stack gap="sm" align="center" w={290} style={{ flexShrink: 0 }}>
        <CardImage item={item} effects={effects} width={290} tiltTouch />
        <Group gap="md" justify="center" wrap="nowrap">
          {nav && <CardNavButtons nav={nav} />}
          {item.imageUrl && <EffectsSwitch effects={effects} onChange={setEffects} />}
        </Group>
      </Stack>
      <Stack gap="md" style={{ flex: 1, minWidth: 0 }}>
        <PriceSummary item={item} edit={edit} />
        <EditFields edit={edit} />
        <Divider />
        {details}
      </Stack>
    </Flex>
  );
}

type CollectionEditBodyProps = {
  edit: CollectionEditState;
  compact?: boolean;
  nav?: CollectionEditNav;
};

export function CollectionEditBody({ edit, compact, nav }: CollectionEditBodyProps) {
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

      <EditBodyContent edit={edit} item={item} compact={compact} nav={nav} />
    </>
  );
}

function EditFooterSkeleton({ compact }: { compact?: boolean }) {
  return (
    <Group justify="space-between" wrap="nowrap" gap="sm">
      {compact ? (
        <Skeleton height={36} style={{ flex: 1 }} radius="sm" />
      ) : (
        <Group gap="sm">
          <Skeleton height={28} width={120} radius="sm" />
          <Skeleton height={28} width={96} radius="sm" />
        </Group>
      )}
      <Skeleton height={36} width={36} radius="sm" />
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

  const { item } = edit;
  const historyCount = item.history.length;
  const historyLabel = `Change history${historyCount > 0 ? ` (${historyCount})` : ''}`;

  const menu = (
    <Menu
      position="top-end"
      withinPortal
      zIndex={COLLECTION_EDIT_DROPDOWN_Z_INDEX}
      onClose={edit.cancelRemove}
    >
      <Menu.Target>
        <ActionIcon
          variant="default"
          size={compact ? 42 : 36}
          aria-label="More actions"
          disabled={edit.busy}
        >
          <DotsThreeIcon size={20} weight="bold" />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        {compact && (
          <>
            <Menu.Item onClick={() => edit.setHistoryOpen(true)}>{historyLabel}</Menu.Item>
            <Menu.Item onClick={() => edit.setPriceHistoryOpen(true)}>Price history</Menu.Item>
            {item.scryfallId && (
              <Menu.Item
                component="a"
                href={scryfallCardUrl(item.scryfallId)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open on Scryfall
              </Menu.Item>
            )}
            {item.tcgplayerProductId && (
              <Menu.Item
                component="a"
                href={tcgplayerProductUrl(item.tcgplayerProductId)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open on TCGPlayer
              </Menu.Item>
            )}
            <Menu.Divider />
          </>
        )}
        <Menu.Item
          color="red"
          closeMenuOnClick={false}
          onClick={edit.handleRemove}
          disabled={edit.removeLoading || edit.saveLoading}
          data-testid="collection-remove"
        >
          {edit.confirmRemove ? 'Click again to remove' : 'Remove from collection'}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );

  if (compact) {
    return (
      <Group gap="sm" wrap="nowrap" w="100%" style={{ minWidth: 0 }}>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <SaveButton edit={edit} fullWidth size="lg" />
        </Box>
        {menu}
      </Group>
    );
  }

  return (
    <Group justify="space-between" wrap="wrap" gap="sm">
      <Group gap="xs" wrap="wrap">
        <Button
          variant="subtle"
          size="compact-sm"
          onClick={() => edit.setHistoryOpen(true)}
          disabled={edit.busy}
          data-testid="collection-change-history"
        >
          {historyLabel}
        </Button>
        <Button
          variant="subtle"
          size="compact-sm"
          onClick={() => edit.setPriceHistoryOpen(true)}
          disabled={edit.busy}
        >
          Price history
        </Button>
        <PrintingExternalLinks
          scryfallId={item.scryfallId}
          tcgplayerProductId={item.tcgplayerProductId}
          variant="subtle"
          wrap="wrap"
        />
      </Group>
      {menu}
    </Group>
  );
}
