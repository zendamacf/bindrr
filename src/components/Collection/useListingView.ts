import { useLocalStorage } from '@mantine/hooks';

export type ListingView = 'binder' | 'table';

/** Binder/list preference, shared by the collection and wishlist pages. */
export function useListingView() {
  return useLocalStorage<ListingView>({
    key: 'bindrr-collection-view',
    defaultValue: 'binder',
    getInitialValueInEffect: true,
  });
}
