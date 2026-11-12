import { NextResponse } from 'next/server';
import { apiInternalErrorResponse } from '@/lib/api/errors';
import { rateLimitForRequest } from '@/lib/api/rateLimitSession';
import { getPreferredCurrencyFromRequest } from '@/lib/currency/header';
import { getWishlistAnyPrintings } from '@/lib/wishlist/getWishlistAnyPrintings';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { user, blocked } = await rateLimitForRequest(request);
  if (blocked) return blocked;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = Number.parseInt((await context.params).id, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    const result = await getWishlistAnyPrintings({
      userId: user.id,
      wishlistCardId: parsed,
      currencyCode: getPreferredCurrencyFromRequest(request),
    });
    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return apiInternalErrorResponse('Failed to load printings', error, {
      route: '/api/wishlist/any/[id]/printings',
      method: 'GET',
      userId: user.id,
    });
  }
}
