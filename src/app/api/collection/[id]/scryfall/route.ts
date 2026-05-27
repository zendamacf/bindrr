import { NextResponse } from 'next/server';
import { apiInternalErrorResponse } from '@/lib/api/errors';
import { getScryfallCardByIdCached } from '@/lib/cache/scryfallCard';
import { getCollectionItem } from '@/lib/collection/getCollectionItem';
import { mapScryfallExtendedDetails } from '@/lib/scryfall/extendedDetails';
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
    if (!item.scryfallId) {
      return NextResponse.json({ error: 'No Scryfall id for this printing' }, { status: 404 });
    }

    const card = await getScryfallCardByIdCached(item.scryfallId);
    return NextResponse.json({ details: mapScryfallExtendedDetails(card) });
  } catch (error) {
    return apiInternalErrorResponse('Failed to load Scryfall details', error, {
      route: '/api/collection/[id]/scryfall',
      method: 'GET',
      userId: user.id,
    });
  }
}
