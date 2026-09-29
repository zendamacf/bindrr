import { NextResponse } from 'next/server';
import { rateLimitForRequest } from '@/lib/api/rateLimitSession';
import { getCardSets } from '@/lib/cache/cardSets';

export async function GET(request: Request) {
  const { user, blocked } = await rateLimitForRequest(request);
  if (blocked) return blocked;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sets = await getCardSets();
  return NextResponse.json({ sets });
}
