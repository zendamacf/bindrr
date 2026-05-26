import { NextResponse } from 'next/server';
import { getCardSets } from '@/lib/collection/getCardSets';
import { getSession } from '@/utils/auth/session';

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sets = await getCardSets();
  return NextResponse.json({ sets });
}
