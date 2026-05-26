import { NextResponse } from 'next/server';
import type { CardFinish } from '@/lib/collection/finish';
import { getCollectionItem } from '@/lib/collection/getCollectionItem';
import { updateCollectionItem } from '@/lib/collection/updateCollectionItem';
import { getSession } from '@/utils/auth/session';

type RouteContext = { params: Promise<{ id: string }> };

function parseCollectionPrintingId(id: string): number | null {
  const parsed = Number.parseInt(id, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(_request: Request, context: RouteContext) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const collectionPrintingId = parseCollectionPrintingId(id);
  if (collectionPrintingId == null) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    const item = await getCollectionItem(user.id, collectionPrintingId);
    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: 'Failed to load card' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const collectionPrintingId = parseCollectionPrintingId(id);
  if (collectionPrintingId == null) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  let body: { quantity?: number; finish?: CardFinish };
  try {
    body = (await request.json()) as { quantity?: number; finish?: CardFinish };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const hasQuantity = typeof body.quantity === 'number';
  const hasFinish = body.finish === 'nonfoil' || body.finish === 'foil' || body.finish === 'etched';

  if (!hasQuantity && !hasFinish) {
    return NextResponse.json({ error: 'Missing quantity or finish' }, { status: 400 });
  }

  if (hasQuantity && (!Number.isFinite(body.quantity) || (body.quantity ?? 0) < 0)) {
    return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
  }

  try {
    const result = await updateCollectionItem({
      userId: user.id,
      collectionPrintingId,
      ...(hasQuantity ? { quantity: body.quantity } : {}),
      ...(hasFinish ? { finish: body.finish } : {}),
    });
    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Failed to update card' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const collectionPrintingId = parseCollectionPrintingId(id);
  if (collectionPrintingId == null) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    const result = await updateCollectionItem({
      userId: user.id,
      collectionPrintingId,
      quantity: 0,
    });
    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Failed to remove card' }, { status: 500 });
  }
}
