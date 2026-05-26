import { NextResponse } from 'next/server';
import {
  scryfallFinishAvailability,
  scryfallImageUrl,
  scryfallSearchPrints,
} from '@/lib/scryfall/client';
import { getSession } from '@/utils/auth/session';

const MIN_QUERY_LENGTH = 3;

export async function GET(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('query') ?? '').trim();

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ results: [] });
  }

  try {
    const cards = await scryfallSearchPrints(query);
    const results = cards.map((c) => {
      const { canAddNonfoil, canAddFoil, canAddEtched } = scryfallFinishAvailability(c.finishes);
      return {
        scryfallId: c.id,
        name: c.name,
        setName: c.set_name,
        setCode: c.set.toUpperCase(),
        collectorNumber: c.collector_number,
        language: c.lang && c.lang !== 'en' ? c.lang.toUpperCase() : null,
        imageUrl: scryfallImageUrl(c),
        priceUsd: c.prices?.usd ?? null,
        priceUsdFoil: c.prices?.usd_foil ?? null,
        priceUsdEtched: c.prices?.usd_etched ?? null,
        tcgplayerProductId: c.tcgplayer_id != null ? String(c.tcgplayer_id) : null,
        canAddNonfoil,
        canAddFoil,
        canAddEtched,
      };
    });

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: 'Failed to search cards' }, { status: 500 });
  }
}
