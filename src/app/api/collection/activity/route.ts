import { NextResponse } from 'next/server';
import { apiInternalErrorResponse } from '@/lib/api/errors';
import { rateLimitForRequest } from '@/lib/api/rateLimitSession';
import { getCollectionActivity } from '@/lib/collection/getCollectionActivity';

function parsePage(value: string | null): number | undefined {
  if (!value) return undefined;
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? page : undefined;
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

  try {
    const result = await getCollectionActivity({
      userId: user.id,
      page: parsePage(searchParams.get('page')),
      filterSearch: searchParams.get('filter_search') ?? undefined,
      filterSet: parseSetId(searchParams.get('filter_set')),
      filterFrom: searchParams.get('filter_from') ?? undefined,
      filterTo: searchParams.get('filter_to') ?? undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiInternalErrorResponse('Failed to load collection activity', error, {
      route: '/api/collection/activity',
      method: 'GET',
      userId: user.id,
    });
  }
}
