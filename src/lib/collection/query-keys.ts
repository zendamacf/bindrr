import type { CollectionQueryParams } from './api';

export const collectionKeys = {
  all: ['collection'] as const,
  sets: () => [...collectionKeys.all, 'sets'] as const,
  list: (params: CollectionQueryParams) => [...collectionKeys.all, 'list', params] as const,
  item: (id: number) => [...collectionKeys.all, 'item', id] as const,
};
