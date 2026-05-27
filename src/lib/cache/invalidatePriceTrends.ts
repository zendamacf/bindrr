import 'server-only';

import { revalidateTag } from 'next/cache';
import { PRICE_TRENDS_CACHE_TAG } from './priceTrends';

export function invalidatePriceTrendsCache(): void {
  revalidateTag(PRICE_TRENDS_CACHE_TAG, { expire: 0 });
}
