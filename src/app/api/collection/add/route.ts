import { NextResponse } from 'next/server';
import { apiInternalErrorResponse } from '@/lib/api/errors';
import { addToCollection } from '@/lib/collection/addToCollection';
import type { CardFinish } from '@/lib/collection/finish';
import { getSession } from '@/utils/auth/session';

type AddBody = {
  scryfallId?: string;
  quantity?: number;
  finish?: CardFinish;
  /** @deprecated Use `finish` instead */
  foil?: boolean;
};

function parseFinish(body: AddBody): CardFinish {
  if (body.finish === 'nonfoil' || body.finish === 'foil' || body.finish === 'etched') {
    return body.finish;
  }
  return body.foil ? 'foil' : 'nonfoil';
}

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
  const finish = parseFinish(body);

  if (!scryfallId) {
    return NextResponse.json({ error: 'Missing scryfallId' }, { status: 400 });
  }

  try {
    const result = await addToCollection({
      userId: user.id,
      scryfallId,
      quantity,
      finish,
    });
    return NextResponse.json(result);
  } catch (error) {
    return apiInternalErrorResponse('Failed to add card', error, {
      route: '/api/collection/add',
      method: 'POST',
      userId: user.id,
    });
  }
}
