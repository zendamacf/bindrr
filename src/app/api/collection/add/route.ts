import { NextResponse } from 'next/server';
import { addToCollection } from '@/lib/collection/addToCollection';
import { getSession } from '@/utils/auth/session';

type AddBody = {
  scryfallId?: string;
  quantity?: number;
  foil?: boolean;
};

export async function POST(request: Request) {
  const user = await getSession();
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
  const quantity = typeof body.quantity === 'number' ? body.quantity : 1;
  const foil = Boolean(body.foil);

  if (!scryfallId) {
    return NextResponse.json({ error: 'Missing scryfallId' }, { status: 400 });
  }

  try {
    const result = await addToCollection({
      userId: user.id,
      scryfallId,
      quantity,
      foil,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Failed to add card' }, { status: 500 });
  }
}
