'use client';

import { Group, Modal, SegmentedControl, Skeleton, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { fetchCollectionItemPriceHistory } from '@/lib/collection/api';
import type { CardFinish } from '@/lib/collection/finish';
import { collectionKeys } from '@/lib/collection/query-keys';
import {
  DEFAULT_PRICE_HISTORY_DAY_RANGE,
  PRICE_HISTORY_DAY_RANGES,
  type PriceHistoryDayRange,
  priceHistoryDaysFromRange,
} from './priceHistoryChartUtils';

const HISTORY_MODAL_Z_INDEX = 2100;

const PriceHistoryChart = dynamic(
  () => import('./PriceHistoryChart').then((mod) => mod.PriceHistoryChart),
  {
    ssr: false,
    loading: () => <Skeleton height={280} radius="sm" />,
  },
);

type PriceHistoryModalProps = {
  opened: boolean;
  onClose: () => void;
  collectionPrintingId: number;
  currentFinish: CardFinish;
};

export function PriceHistoryModal({
  opened,
  onClose,
  collectionPrintingId,
  currentFinish,
}: PriceHistoryModalProps) {
  const [dayRange, setDayRange] = useState<PriceHistoryDayRange>(DEFAULT_PRICE_HISTORY_DAY_RANGE);
  const days = priceHistoryDaysFromRange(dayRange);

  const priceHistoryQuery = useQuery({
    queryKey: collectionKeys.itemPriceHistory(collectionPrintingId, days),
    queryFn: () =>
      fetchCollectionItemPriceHistory(collectionPrintingId, days != null ? { days } : undefined),
    enabled: opened,
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Price history"
      size="lg"
      centered
      zIndex={HISTORY_MODAL_Z_INDEX}
    >
      <Stack gap="md">
        <Group justify="flex-end">
          <SegmentedControl
            value={dayRange}
            onChange={(value) => setDayRange(value as PriceHistoryDayRange)}
            data={PRICE_HISTORY_DAY_RANGES.map((option) => ({
              label: option.label,
              value: option.value,
            }))}
            size="xs"
          />
        </Group>

        {priceHistoryQuery.isPending && <Skeleton height={280} radius="sm" />}
        {priceHistoryQuery.error && <Text c="dimmed">Could not load price history.</Text>}
        {priceHistoryQuery.data && (
          <PriceHistoryChart history={priceHistoryQuery.data} currentFinish={currentFinish} />
        )}
      </Stack>
    </Modal>
  );
}
