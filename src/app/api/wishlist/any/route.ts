import { NextResponse } from 'next/server';
import { apiInternalErrorResponse } from '@/lib/api/errors';
import { rateLimitForRequest } from '@/lib/api/rateLimitSession';
import { getPreferredCurrencyFromRequest } from '@/lib/currency/header';
import { addAnyPrintingToWishlist } from '@/lib/wishlist/addAnyPrintingToWishlist';
import { isWishlistFinish } from '@/lib/wishlist/finish';
import { getWishlistAny } from '@/lib/wishlist/getWishlistAny';

type AddBody = {
  scryfallId?: string;
  quantity?: number;
  finish?: string;
};

export async function GET(request: Request) {
  const { user, blocked } = await rateLimitForRequest(request);
  if (blocked) return blocked;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await getWishlistAny({
      userId: user.id,
      currencyCode: getPreferredCurrencyFromRequest(request),
    });
    return NextResponse.json(result);
  } catch (error) {
    return apiInternalErrorResponse('Failed to load wishlist', error, {
      route: '/api/wishlist/any',
      method: 'GET',
      userId: user.id,
    });
  }
}

export async function POST(request: Request) {
  const { user, blocked } = await rateLimitForRequest(request);
  if (blocked) return blocked;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: AddBody;
  try {
    body = (await request.json()) as AddBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const scryfallId = typeof body.scryfallId === 'string' ? body.scryfallId.trim() : '';
  if (!scryfallId) {
    return NextResponse.json({ error: 'Missing scryfallId' }, { status: 400 });
  }

  const quantity = body.quantity === undefined ? 1 : body.quantity;
  if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity < 1) {
    return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
  }

  const finish = body.finish === undefined ? 'any' : body.finish;
  if (!isWishlistFinish(finish)) {
    return NextResponse.json({ error: 'Invalid finish' }, { status: 400 });
  }

  try {
    const result = await addAnyPrintingToWishlist({
      userId: user.id,
      scryfallId,
      quantity,
      finish,
    });
    return NextResponse.json(result);
  } catch (error) {
    return apiInternalErrorResponse('Failed to add card to wishlist', error, {
      route: '/api/wishlist/any',
      method: 'POST',
      userId: user.id,
    });
  }
}
