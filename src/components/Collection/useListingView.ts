import { useLocalStorage, useMounted } from '@mantine/hooks';

export type ListingView = 'binder' | 'table';

/**
 * Binder/list preference, shared by the collection and wishlist pages.
 *
 * The saved value is read after mount (so server and client markup match). Until then `ready`
 * is false: wait for it before fetching, or the page requests the wrong page size first.
 */
export function useListingView() {
  const ready = useMounted();
  const [view, setView] = useLocalStorage<ListingView>({
    key: 'bindrr-collection-view',
    defaultValue: 'binder',
    getInitialValueInEffect: true,
  });
  return [view, setView, ready] as const;
}
