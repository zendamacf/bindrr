import { apiFetch } from '@/lib/api/fetch';
import type { SortDirection } from '@/lib/collection/types';
import { apiRoutes } from '@/routes';
import type { WishlistFinish } from './finish';
import type { GetWishlistResult, WishlistSort } from './types';

export type WishlistQueryParams = {
  page: number;
  sort: WishlistSort;
  sortDesc: SortDirection;
  filterSearch?: string;
  filterSet?: string | null;
  filterRarity?: string | null;
  filterFinish?: WishlistFinish | null;
};

export type AddWishlistCardResult = {
  ok?: boolean;
  wishlistPrintingId?: number;
  quantity?: number;
  /** True when the printing is also on the wishlist with a finish that can match the same card. */
  overlapsOtherFinish?: boolean;
  error?: string;
};

async function parseJson<T>(res: Response): Promise<T> {
  return res.json() as Promise<T>;
}

export async function fetchWishlist(params: WishlistQueryParams): Promise<GetWishlistResult> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    sort: params.sort,
    sort_desc: params.sortDesc,
  });
  if (params.filterSearch) searchParams.set('filter_search', params.filterSearch);
  if (params.filterSet) searchParams.set('filter_set', params.filterSet);
  if (params.filterRarity) searchParams.set('filter_rarity', params.filterRarity);
  if (params.filterFinish) searchParams.set('filter_finish', params.filterFinish);

  const res = await apiFetch(`${apiRoutes.wishlist}?${searchParams.toString()}`);
  const body = await parseJson<GetWishlistResult & { error?: string }>(res);
  if (!res.ok) throw new Error(body.error ?? 'Failed to load wishlist');
  return body;
}

export async function addWishlistCard(params: {
  scryfallId: string;
  quantity: number;
  finish: WishlistFinish;
}): Promise<AddWishlistCardResult> {
  const res = await apiFetch(apiRoutes.wishlistAdd, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  });
  const body = await parseJson<AddWishlistCardResult>(res);
  if (!res.ok) throw new Error(body.error ?? 'Failed to add card to wishlist');
  return body;
}

export async function updateWishlistCard(
  id: number,
  patch: { quantity?: number; finish?: WishlistFinish },
) {
  const res = await apiFetch(apiRoutes.wishlistItem(id), {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch),
  });
  const body = await parseJson<{
    ok?: boolean;
    removed?: boolean;
    wishlistPrintingId?: number;
    error?: string;
  }>(res);
  if (!res.ok) throw new Error(body.error ?? 'Failed to update wishlist item');
  return body;
}

export async function removeWishlistCard(id: number) {
  const res = await apiFetch(apiRoutes.wishlistItem(id), { method: 'DELETE' });
  const body = await parseJson<{ ok?: boolean; error?: string }>(res);
  if (!res.ok) throw new Error(body.error ?? 'Failed to remove wishlist item');
  return body;
}
