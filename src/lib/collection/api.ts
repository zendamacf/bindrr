import { apiRoutes, collectionApiUrl } from '@/routes';
import type { CardSearchResult, CollectionSort, GetCollectionResult, SortDirection } from './types';

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
  foil: boolean;
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
