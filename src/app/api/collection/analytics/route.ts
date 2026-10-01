import { NextResponse } from 'next/server';
import { apiInternalErrorResponse } from '@/lib/api/errors';
import { rateLimitForRequest } from '@/lib/api/rateLimitSession';
import {
  getCollectionAnalytics,
  parseCollectionAnalyticsDaysParam,
} from '@/lib/collection/getCollectionAnalytics';
import { getPreferredCurrencyFromRequest } from '@/lib/currency/header';

export async function GET(request: Request) {
  const { user, blocked } = await rateLimitForRequest(request);
  if (blocked) return blocked;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const days = parseCollectionAnalyticsDaysParam(new URL(request.url).searchParams.get('days'));

  try {
    const analytics = await getCollectionAnalytics({
      userId: user.id,
      currencyCode: getPreferredCurrencyFromRequest(request),
      days,
    });

    return NextResponse.json(analytics);
  } catch (error) {
    return apiInternalErrorResponse('Failed to load collection analytics', error, {
      route: '/api/collection/analytics',
      method: 'GET',
      userId: user.id,
    });
  }
}
