import { NextResponse } from 'next/server';
import { apiInternalErrorResponse } from '@/lib/api/errors';
import {
  getCollectionItemPriceHistory,
  parsePriceHistoryDaysParam,
} from '@/lib/collection/getPrintingPriceHistory';
import { getPreferredCurrencyFromRequest } from '@/lib/currency/header';
import { getSession } from '@/utils/auth/session';

type RouteContext = { params: Promise<{ id: string }> };

function parseCollectionPrintingId(id: string): number | null {
  const parsed = Number.parseInt(id, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(request: Request, context: RouteContext) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const collectionPrintingId = parseCollectionPrintingId(id);
  if (collectionPrintingId == null) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const days = parsePriceHistoryDaysParam(new URL(request.url).searchParams.get('days'));

  try {
    const history = await getCollectionItemPriceHistory(
      user.id,
      collectionPrintingId,
      getPreferredCurrencyFromRequest(request),
      days != null ? { days } : undefined,
    );
    if (!history) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(history);
  } catch (error) {
    return apiInternalErrorResponse('Failed to load price history', error, {
      route: '/api/collection/[id]/price-history',
      method: 'GET',
      userId: user.id,
    });
  }
}
