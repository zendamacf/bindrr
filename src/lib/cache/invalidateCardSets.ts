import 'server-only';

import { revalidateTag } from 'next/cache';
import { CARD_SETS_CACHE_TAG } from './cardSets';

export function invalidateCardSetsCache(): void {
  revalidateTag(CARD_SETS_CACHE_TAG, { expire: 0 });
}
