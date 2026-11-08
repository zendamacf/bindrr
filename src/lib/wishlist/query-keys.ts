import type { WishlistQueryParams } from './api';

export const wishlistKeys = {
  all: ['wishlist'] as const,
  list: (params: WishlistQueryParams) => [...wishlistKeys.all, 'list', params] as const,
};
