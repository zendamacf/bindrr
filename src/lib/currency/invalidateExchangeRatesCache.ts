import 'server-only';

import { revalidateTag } from 'next/cache';
import { EXCHANGE_RATES_CACHE_TAG } from './exchangeRates';

export function invalidateExchangeRatesCache(): void {
  revalidateTag(EXCHANGE_RATES_CACHE_TAG, { expire: 0 });
}
