/** Umami custom event names (no PII in payloads). */
export const umamiEvents = {
  collectionAdd: 'collection_add',
  collectionUpdate: 'collection_update',
  collectionRemove: 'collection_remove',
  collectionImport: 'collection_import',
  wishlistAdd: 'wishlist_add',
  wishlistUpdate: 'wishlist_update',
  wishlistRemove: 'wishlist_remove',
  wishlistMove: 'wishlist_move',
  currencyChange: 'currency_change',
  loginFailed: 'login_failed',
  logout: 'logout',
} as const;

export type UmamiEventName = (typeof umamiEvents)[keyof typeof umamiEvents];
