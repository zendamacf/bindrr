import type { WishlistQueryParams } from './api';

export const wishlistKeys = {
  all: ['wishlist'] as const,
  list: (params: WishlistQueryParams) => [...wishlistKeys.all, 'list', params] as const,
  any: () => [...wishlistKeys.all, 'any'] as const,
  anyPrintings: (id: number) => [...wishlistKeys.all, 'any-printings', id] as const,
};
