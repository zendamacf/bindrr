'use client';

import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  fetchCollectionItem,
  removeCollectionItem,
  updateCollectionItemQuantity,
} from '@/lib/collection/api';
import { collectionKeys } from '@/lib/collection/query-keys';
import type { CollectionItemDetail } from '@/lib/collection/types';

export type CollectionEditState = {
  collectionPrintingId: number;
  item: CollectionItemDetail | undefined;
  isPending: boolean;
  error: Error | null;
  quantity: number | string;
  setQuantity: (value: number | string) => void;
  busy: boolean;
  quantityChanged: boolean;
  confirmRemove: boolean;
  historyOpen: boolean;
  setHistoryOpen: (open: boolean) => void;
  handleSave: () => void;
  handleRemove: () => void;
  saveLoading: boolean;
  removeLoading: boolean;
};

export function useCollectionEdit(
  collectionPrintingId: number | null,
  onRemoved: () => void,
  enabled: boolean,
): CollectionEditState | null {
  const qc = useQueryClient();
  const [quantity, setQuantity] = useState<number | string>(1);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

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
    if (item) setQuantity(item.quantity);
  }, [item]);

  useEffect(() => {
    if (!enabled) {
      setConfirmRemove(false);
      setHistoryOpen(false);
    }
  }, [enabled]);

  const invalidateCollection = () => {
    void qc.invalidateQueries({ queryKey: collectionKeys.all });
  };

  const updateMutation = useMutation({
    mutationFn: (nextQuantity: number) => {
      if (collectionPrintingId == null) {
        throw new Error('collectionPrintingId is required');
      }
      return updateCollectionItemQuantity(collectionPrintingId, nextQuantity);
    },
    onSuccess: (result) => {
      if (result.removed) {
        notifications.show({ message: 'Card removed from collection.', color: 'green' });
        invalidateCollection();
        onRemoved();
        return;
      }
      notifications.show({ message: 'Quantity updated.', color: 'green' });
      invalidateCollection();
      if (collectionPrintingId != null) {
        void qc.invalidateQueries({ queryKey: collectionKeys.item(collectionPrintingId) });
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

  return {
    collectionPrintingId,
    item,
    isPending: itemQuery.isPending,
    error: itemQuery.error,
    quantity,
    setQuantity,
    busy,
    quantityChanged,
    confirmRemove,
    historyOpen,
    setHistoryOpen,
    handleSave,
    handleRemove,
    saveLoading: updateMutation.isPending,
    removeLoading: removeMutation.isPending,
  };
}
