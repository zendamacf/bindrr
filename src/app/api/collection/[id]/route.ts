import { NextResponse } from 'next/server';
import { getCollectionItem } from '@/lib/collection/getCollectionItem';
import { updateCollectionItemQuantity } from '@/lib/collection/updateCollectionItem';
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

  let body: { quantity?: number };
  try {
    body = (await request.json()) as { quantity?: number };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body.quantity !== 'number') {
    return NextResponse.json({ error: 'Missing quantity' }, { status: 400 });
  }

  try {
    const result = await updateCollectionItemQuantity({
      userId: user.id,
      collectionPrintingId,
      quantity: body.quantity,
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
    const result = await updateCollectionItemQuantity({
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
