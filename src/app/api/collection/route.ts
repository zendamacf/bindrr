import { NextResponse } from 'next/server';
import { apiInternalErrorResponse } from '@/lib/api/errors';
import { getCollection } from '@/lib/collection/getCollection';
import type { CollectionSort, SortDirection } from '@/lib/collection/types';
import { getPreferredCurrencyFromRequest } from '@/lib/currency/header';
import { getSession } from '@/utils/auth/session';

const SORT_KEYS: CollectionSort[] = ['name', 'setname', 'rarity', 'quantity', 'foil', 'price'];

function parsePage(value: string | null): number | undefined {
  if (!value) return undefined;
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? page : undefined;
}

function parseSort(value: string | null): CollectionSort | undefined {
  if (value && SORT_KEYS.includes(value as CollectionSort)) {
    return value as CollectionSort;
  }
  return undefined;
}

function parseSortDesc(value: string | null): SortDirection | undefined {
  return value === 'asc' || value === 'desc' ? value : undefined;
}

function parseSetId(value: string | null): number | undefined {
  if (!value) return undefined;
  const id = Number.parseInt(value, 10);
  return Number.isFinite(id) ? id : undefined;
}

export async function GET(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  try {
    const result = await getCollection({
      userId: user.id,
      currencyCode: getPreferredCurrencyFromRequest(request),
      page: parsePage(searchParams.get('page')),
      sort: parseSort(searchParams.get('sort')),
      sortDesc: parseSortDesc(searchParams.get('sort_desc')),
      filterSearch: searchParams.get('filter_search') ?? undefined,
      filterSet: parseSetId(searchParams.get('filter_set')),
      filterRarity: searchParams.get('filter_rarity') ?? undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiInternalErrorResponse('Failed to load collection', error, {
      route: '/api/collection',
      method: 'GET',
      userId: user.id,
    });
  }
}
