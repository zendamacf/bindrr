import 'server-only';

import { desc } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import { card_sets } from '@/lib/db/schema';

export const CARD_SETS_CACHE_TAG = 'card-sets';

/** Safety TTL; new sets also trigger explicit revalidation from {@link ensureCardSet}. */
const CARD_SETS_REVALIDATE_SECONDS = 3_600;

export type CardSetOption = {
  id: number;
  name: string;
  code: string;
  symbolSvgUri: string | null;
};

export async function loadCardSetsFromDb(): Promise<CardSetOption[]> {
  return db
    .select({
      id: card_sets.id,
      name: card_sets.name,
      code: card_sets.code,
      symbolSvgUri: card_sets.symbol_svg_uri,
    })
    .from(card_sets)
    .orderBy(desc(card_sets.released));
}

const getCachedCardSets = unstable_cache(loadCardSetsFromDb, ['card-sets-list'], {
  revalidate: CARD_SETS_REVALIDATE_SECONDS,
  tags: [CARD_SETS_CACHE_TAG],
});

export async function getCardSets(): Promise<CardSetOption[]> {
  return getCachedCardSets();
}
