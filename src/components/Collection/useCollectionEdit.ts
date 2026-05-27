'use client';

import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  fetchCollectionItem,
  removeCollectionItem,
  updateCollectionItem,
} from '@/lib/collection/api';
import { type CardFinish, finishFromFlags, finishLabelForFinish } from '@/lib/collection/finish';
import { collectionKeys } from '@/lib/collection/query-keys';
import type { CollectionItemDetail } from '@/lib/collection/types';

export type CollectionEditState = {
  collectionPrintingId: number;
  item: CollectionItemDetail | undefined;
  isPending: boolean;
  error: Error | null;
  quantity: number | string;
  setQuantity: (value: number | string) => void;
  finish: CardFinish;
  setFinish: (value: CardFinish) => void;
  finishOptions: { value: CardFinish; label: string; disabled?: boolean }[];
  busy: boolean;
  quantityChanged: boolean;
  finishChanged: boolean;
  hasChanges: boolean;
  confirmRemove: boolean;
  historyOpen: boolean;
  setHistoryOpen: (open: boolean) => void;
  priceHistoryOpen: boolean;
  setPriceHistoryOpen: (open: boolean) => void;
  handleSave: () => void;
  handleRemove: () => void;
  saveLoading: boolean;
  removeLoading: boolean;
};

export function useCollectionEdit(
  collectionPrintingId: number | null,
  onRemoved: () => void,
  enabled: boolean,
  onCollectionPrintingIdChange?: (id: number) => void,
): CollectionEditState | null {
  const qc = useQueryClient();
  const [quantity, setQuantity] = useState<number | string>(1);
  const [finish, setFinish] = useState<CardFinish>('nonfoil');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [priceHistoryOpen, setPriceHistoryOpen] = useState(false);

  const itemQuery = useQuery({
    queryKey: collectionKeys.item(collectionPrintingId ?? 0),
    queryFn: () => {
      if (collectionPrintingId == null) {
        throw new Error('collectionPrintingId is required');
      }
      return fetchCollectionItem(collectionPrintingId);
    },
    enabled: enabled && collectionPrintingId != null,
  });

  const item = itemQuery.data;

  useEffect(() => {
    if (item) {
      setQuantity(item.quantity);
      setFinish(finishFromFlags(item.foil, item.etched));
    }
  }, [item]);

  useEffect(() => {
    if (!enabled) {
      setConfirmRemove(false);
      setHistoryOpen(false);
      setPriceHistoryOpen(false);
    }
  }, [enabled]);

  const invalidateCollection = () => {
    void qc.invalidateQueries({ queryKey: collectionKeys.all });
  };

  const updateMutation = useMutation({
    mutationFn: (patch: { quantity: number; finish: CardFinish }) => {
      if (collectionPrintingId == null) {
        throw new Error('collectionPrintingId is required');
      }
      return updateCollectionItem(collectionPrintingId, patch);
    },
    onSuccess: (result) => {
      if (result.removed) {
        notifications.show({ message: 'Card removed from collection.', color: 'green' });
        invalidateCollection();
        onRemoved();
        return;
      }

      const nextId = result.collectionPrintingId;
      if (nextId != null && nextId !== collectionPrintingId) {
        onCollectionPrintingIdChange?.(nextId);
      }

      notifications.show({ message: 'Card updated.', color: 'green' });
      invalidateCollection();
      if (collectionPrintingId != null) {
        void qc.invalidateQueries({ queryKey: collectionKeys.item(collectionPrintingId) });
      }
      if (nextId != null) {
        void qc.invalidateQueries({ queryKey: collectionKeys.item(nextId) });
      }
    },
    onError: (e) => {
      notifications.show({
        message: e instanceof Error ? e.message : 'Failed to update card',
        color: 'red',
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => {
      if (collectionPrintingId == null) {
        throw new Error('collectionPrintingId is required');
      }
      return removeCollectionItem(collectionPrintingId);
    },
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

  if (collectionPrintingId == null) return null;

  const busy = updateMutation.isPending || removeMutation.isPending;
  const parsedQuantity = typeof quantity === 'number' ? quantity : Number(quantity);
  const quantityValid = Number.isFinite(parsedQuantity) && parsedQuantity >= 0;
  const quantityChanged = item != null && quantityValid && parsedQuantity !== item.quantity;
  const finishChanged = item != null && finish !== finishFromFlags(item.foil, item.etched);
  const hasChanges = quantityChanged || finishChanged;

  const finishOptions: CollectionEditState['finishOptions'] = item
    ? (['nonfoil', 'foil', 'etched'] as const).map((value) => ({
        value,
        label: finishLabelForFinish(value),
        disabled:
          (value === 'nonfoil' && !item.canAddNonfoil) ||
          (value === 'foil' && !item.canAddFoil) ||
          (value === 'etched' && !item.canAddEtched),
      }))
    : [];

  const handleSave = () => {
    if (!quantityValid || item == null) return;
    updateMutation.mutate({ quantity: parsedQuantity, finish });
  };

  const handleRemove = () => {
    if (!confirmRemove) {
      setConfirmRemove(true);
      return;
    }
    removeMutation.mutate();
  };

  return {
    collectionPrintingId,
    item,
    isPending: itemQuery.isPending,
    error: itemQuery.error,
    quantity,
    setQuantity,
    finish,
    setFinish,
    finishOptions,
    busy,
    quantityChanged,
    finishChanged,
    hasChanges,
    confirmRemove,
    historyOpen,
    setHistoryOpen,
    priceHistoryOpen,
    setPriceHistoryOpen,
    handleSave,
    handleRemove,
    saveLoading: updateMutation.isPending,
    removeLoading: removeMutation.isPending,
  };
}
