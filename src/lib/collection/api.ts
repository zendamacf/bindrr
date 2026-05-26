import { apiRoutes, collectionApiUrl } from '@/routes';
import type { CardFinish } from './finish';
import type {
  CardSearchResult,
  CollectionItemDetail,
  CollectionSort,
  GetCollectionResult,
  ScryfallCardExtendedDetails,
  SortDirection,
} from './types';

export type CardSetOption = { id: number; name: string; code: string };

export type CollectionQueryParams = {
  page: number;
  sort: CollectionSort;
  sortDesc: SortDirection;
  filterSearch?: string;
  filterSet?: string | null;
  filterRarity?: string | null;
};

async function parseJson<T>(res: Response): Promise<T> {
  return res.json() as Promise<T>;
}

export async function searchCards(query: string): Promise<CardSearchResult[]> {
  const url = new URL(apiRoutes.cardSearch, 'http://localhost');
  url.searchParams.set('query', query);

  const res = await fetch(url.pathname + url.search);
  const body = await parseJson<{ results?: CardSearchResult[]; error?: string }>(res);
  if (!res.ok) throw new Error(body.error ?? 'Failed to search cards');
  return body.results ?? [];
}

export async function addCollectionCard(params: {
  scryfallId: string;
  quantity: number;
  finish: CardFinish;
}) {
  const res = await fetch(apiRoutes.collectionAdd, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  });
  const body = await parseJson<{ ok?: boolean; error?: string }>(res);
  if (!res.ok) throw new Error(body.error ?? 'Failed to add card');
  return body;
}

export async function fetchCardSets(): Promise<CardSetOption[]> {
  const res = await fetch(apiRoutes.collectionSets);
  const body = await parseJson<{ sets?: CardSetOption[]; error?: string }>(res);
  if (!res.ok) throw new Error(body.error ?? 'Failed to load sets');
  return body.sets ?? [];
}

export async function fetchCollectionItemScryfall(
  id: number,
): Promise<ScryfallCardExtendedDetails> {
  const res = await fetch(apiRoutes.collectionItemScryfall(id));
  const body = await parseJson<{ details?: ScryfallCardExtendedDetails; error?: string }>(res);
  if (!res.ok) throw new Error(body.error ?? 'Failed to load card details');
  if (!body.details) throw new Error('Failed to load card details');
  return body.details;
}

export async function fetchCollectionItem(id: number): Promise<CollectionItemDetail> {
  const res = await fetch(apiRoutes.collectionItem(id));
  const body = await parseJson<{ item?: CollectionItemDetail; error?: string }>(res);
  if (!res.ok) throw new Error(body.error ?? 'Failed to load card');
  if (!body.item) throw new Error('Failed to load card');
  return body.item;
}

export async function updateCollectionItem(
  id: number,
  patch: { quantity?: number; finish?: CardFinish },
) {
  const res = await fetch(apiRoutes.collectionItem(id), {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch),
  });
  const body = await parseJson<{
    ok?: boolean;
    removed?: boolean;
    collectionPrintingId?: number;
    error?: string;
  }>(res);
  if (!res.ok) throw new Error(body.error ?? 'Failed to update card');
  return body;
}

/** @deprecated Use {@link updateCollectionItem} */
export async function updateCollectionItemQuantity(id: number, quantity: number) {
  return updateCollectionItem(id, { quantity });
}

export async function removeCollectionItem(id: number) {
  const res = await fetch(apiRoutes.collectionItem(id), { method: 'DELETE' });
  const body = await parseJson<{ ok?: boolean; error?: string }>(res);
  if (!res.ok) throw new Error(body.error ?? 'Failed to remove card');
  return body;
}

export async function fetchCollection(params: CollectionQueryParams): Promise<GetCollectionResult> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    sort: params.sort,
    sort_desc: params.sortDesc,
  });
  if (params.filterSearch) searchParams.set('filter_search', params.filterSearch);
  if (params.filterSet) searchParams.set('filter_set', params.filterSet);
  if (params.filterRarity) searchParams.set('filter_rarity', params.filterRarity);

  const res = await fetch(collectionApiUrl(searchParams));
  const body = await parseJson<GetCollectionResult & { error?: string }>(res);
  if (!res.ok) throw new Error(body.error ?? 'Failed to load collection');
  return body;
}
