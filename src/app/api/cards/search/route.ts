import { NextResponse } from 'next/server';
import { apiInternalErrorResponse } from '@/lib/api/errors';
import {
  scryfallFinishAvailability,
  scryfallImageUrl,
  scryfallSearchPrints,
} from '@/lib/scryfall/client';
import {
  DEFAULT_SCRYFALL_LANGUAGE,
  isScryfallLanguageCode,
  normalizeScryfallLanguageCode,
} from '@/lib/scryfall/languages';
import { getSession } from '@/utils/auth/session';

const MIN_QUERY_LENGTH = 3;

export async function GET(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('query') ?? '').trim();
  const langParam = (searchParams.get('lang') ?? DEFAULT_SCRYFALL_LANGUAGE).trim().toLowerCase();

  if (!isScryfallLanguageCode(langParam)) {
    return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
  }

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ results: [] });
  }

  try {
    const cards = await scryfallSearchPrints(query, { lang: langParam });
    const results = cards.map((c) => {
      const { canAddNonfoil, canAddFoil, canAddEtched } = scryfallFinishAvailability(c.finishes);
      return {
        scryfallId: c.id,
        name: c.name,
        setName: c.set_name,
        setCode: c.set.toUpperCase(),
        collectorNumber: c.collector_number,
        languageCode: normalizeScryfallLanguageCode(c.lang),
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
  } catch (error) {
    return apiInternalErrorResponse('Failed to search cards', error, {
      route: '/api/cards/search',
      method: 'GET',
      userId: user.id,
    });
  }
}
