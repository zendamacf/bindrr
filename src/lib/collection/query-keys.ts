import type { CollectionActivityQueryParams, CollectionQueryParams } from './api';
import { COLLECTION_ANALYTICS_DEFAULT_DAYS } from './collectionAnalyticsConstants';

export const collectionKeys = {
  all: ['collection'] as const,
  sets: () => [...collectionKeys.all, 'sets'] as const,
  list: (params: CollectionQueryParams) => [...collectionKeys.all, 'list', params] as const,
  item: (id: number) => [...collectionKeys.all, 'item', id] as const,
  itemScryfall: (id: number) => [...collectionKeys.all, 'item', id, 'scryfall'] as const,
  itemPriceHistory: (id: number, days?: number) =>
    [...collectionKeys.all, 'item', id, 'price-history', days ?? 'all'] as const,
  activity: (params: CollectionActivityQueryParams) =>
    [...collectionKeys.all, 'activity', params] as const,
  analytics: (days?: number) =>
    [...collectionKeys.all, 'analytics', days ?? COLLECTION_ANALYTICS_DEFAULT_DAYS] as const,
};
