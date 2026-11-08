import { NextResponse } from 'next/server';
import { apiInternalErrorResponse } from '@/lib/api/errors';
import { rateLimitForRequest } from '@/lib/api/rateLimitSession';
import { CARD_FINISHES, type CardFinish } from '@/lib/collection/finish';
import {
  InvalidMoveQuantityError,
  moveWishlistToCollection,
} from '@/lib/wishlist/moveWishlistToCollection';

type RouteContext = { params: Promise<{ id: string }> };

function parseWishlistPrintingId(id: string): number | null {
  const parsed = Number.parseInt(id, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function isCardFinish(value: unknown): value is CardFinish {
  return typeof value === 'string' && (CARD_FINISHES as string[]).includes(value);
}

export async function POST(request: Request, context: RouteContext) {
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

  let body: { finish?: unknown; quantity?: unknown };
  try {
    body = (await request.json()) as { finish?: unknown; quantity?: unknown };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!isCardFinish(body.finish)) {
    return NextResponse.json({ error: 'Missing or invalid finish' }, { status: 400 });
  }

  const quantity = body.quantity;
  if (
    quantity !== undefined &&
    (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity < 1)
  ) {
    return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
  }

  try {
    const result = await moveWishlistToCollection({
      userId: user.id,
      wishlistPrintingId,
      finish: body.finish,
      ...(quantity !== undefined ? { quantity } : {}),
    });
    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof InvalidMoveQuantityError) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }
    return apiInternalErrorResponse('Failed to move wishlist item', error, {
      route: '/api/wishlist/[id]/move',
      method: 'POST',
      userId: user.id,
    });
  }
}
