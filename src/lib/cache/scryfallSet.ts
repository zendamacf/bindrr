import 'server-only';

import { unstable_cache } from 'next/cache';
import { type ScryfallSet, scryfallGetSetByCode } from '@/lib/scryfall/client';

const SCRYFALL_SET_REVALIDATE_SECONDS = 604_800;

function scryfallSetCacheTag(normalizedCode: string): string {
  return `scryfall-set-${normalizedCode}`;
}

export async function getScryfallSetByCodeCached(setCode: string): Promise<ScryfallSet> {
  const code = setCode.trim().toLowerCase();

  const cached = unstable_cache(() => scryfallGetSetByCode(code), ['scryfall-set', code], {
    revalidate: SCRYFALL_SET_REVALIDATE_SECONDS,
    tags: [scryfallSetCacheTag(code)],
  });

  return cached();
}
