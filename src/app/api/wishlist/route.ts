import { NextResponse } from 'next/server';
import { apiInternalErrorResponse } from '@/lib/api/errors';
import { rateLimitForRequest } from '@/lib/api/rateLimitSession';
import type { SortDirection } from '@/lib/collection/types';
import { getPreferredCurrencyFromRequest } from '@/lib/currency/header';
import { isWishlistFinish } from '@/lib/wishlist/finish';
import { getWishlist } from '@/lib/wishlist/getWishlist';
import { WISHLIST_SORT_KEYS, type WishlistSort } from '@/lib/wishlist/types';

function parsePage(value: string | null): number | undefined {
  if (!value) return undefined;
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? page : undefined;
}

function parseSort(value: string | null): WishlistSort | undefined {
  return value && WISHLIST_SORT_KEYS.includes(value as WishlistSort)
    ? (value as WishlistSort)
    : undefined;
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
  const { user, blocked } = await rateLimitForRequest(request);
  if (blocked) return blocked;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const finish = searchParams.get('filter_finish');

  try {
    const result = await getWishlist({
      userId: user.id,
      currencyCode: getPreferredCurrencyFromRequest(request),
      page: parsePage(searchParams.get('page')),
      sort: parseSort(searchParams.get('sort')),
      sortDesc: parseSortDesc(searchParams.get('sort_desc')),
      filterSearch: searchParams.get('filter_search') ?? undefined,
      filterSet: parseSetId(searchParams.get('filter_set')),
      filterRarity: searchParams.get('filter_rarity') ?? undefined,
      filterFinish: isWishlistFinish(finish) ? finish : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiInternalErrorResponse('Failed to load wishlist', error, {
      route: '/api/wishlist',
      method: 'GET',
      userId: user.id,
    });
  }
}
