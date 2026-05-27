'use client';

import { Modal, Skeleton, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { fetchCollectionItemPriceHistory } from '@/lib/collection/api';
import type { CardFinish } from '@/lib/collection/finish';
import { collectionKeys } from '@/lib/collection/query-keys';

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
  const priceHistoryQuery = useQuery({
    queryKey: collectionKeys.itemPriceHistory(collectionPrintingId),
    queryFn: () => fetchCollectionItemPriceHistory(collectionPrintingId),
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
      {priceHistoryQuery.isPending && <Skeleton height={280} radius="sm" />}
      {priceHistoryQuery.error && <Text c="dimmed">Could not load price history.</Text>}
      {priceHistoryQuery.data && (
        <PriceHistoryChart history={priceHistoryQuery.data} currentFinish={currentFinish} />
      )}
    </Modal>
  );
}
