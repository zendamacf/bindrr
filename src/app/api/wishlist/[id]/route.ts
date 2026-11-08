import { NextResponse } from 'next/server';
import { apiInternalErrorResponse } from '@/lib/api/errors';
import { rateLimitForRequest } from '@/lib/api/rateLimitSession';
import { isWishlistFinish } from '@/lib/wishlist/finish';
import { updateWishlistItem } from '@/lib/wishlist/updateWishlistItem';

type RouteContext = { params: Promise<{ id: string }> };

function parseWishlistPrintingId(id: string): number | null {
  const parsed = Number.parseInt(id, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { user, blocked } = await rateLimitForRequest(request);
  if (blocked) return blocked;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const wishlistPrintingId = parseWishlistPrintingId(id);
  if (wishlistPrintingId == null) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  let body: { quantity?: unknown; finish?: unknown };
  try {
    body = (await request.json()) as { quantity?: unknown; finish?: unknown };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const hasQuantity = body.quantity !== undefined;
  const hasFinish = body.finish !== undefined;

  if (!hasQuantity && !hasFinish) {
    return NextResponse.json({ error: 'Missing quantity or finish' }, { status: 400 });
  }
  if (
    hasQuantity &&
    (typeof body.quantity !== 'number' || !Number.isFinite(body.quantity) || body.quantity < 0)
  ) {
    return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
  }
  if (hasFinish && !isWishlistFinish(body.finish)) {
    return NextResponse.json({ error: 'Invalid finish' }, { status: 400 });
  }

  try {
    const result = await updateWishlistItem({
      userId: user.id,
      wishlistPrintingId,
      ...(hasQuantity ? { quantity: body.quantity as number } : {}),
      ...(hasFinish && isWishlistFinish(body.finish) ? { finish: body.finish } : {}),
    });
    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return apiInternalErrorResponse('Failed to update wishlist item', error, {
      route: '/api/wishlist/[id]',
      method: 'PATCH',
      userId: user.id,
    });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { user, blocked } = await rateLimitForRequest(request);
  if (blocked) return blocked;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const wishlistPrintingId = parseWishlistPrintingId(id);
  if (wishlistPrintingId == null) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    const result = await updateWishlistItem({
      userId: user.id,
      wishlistPrintingId,
      quantity: 0,
    });
    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return apiInternalErrorResponse('Failed to remove wishlist item', error, {
      route: '/api/wishlist/[id]',
      method: 'DELETE',
      userId: user.id,
    });
  }
}
