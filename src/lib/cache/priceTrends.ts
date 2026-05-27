import 'server-only';

import { unstable_cache } from 'next/cache';
import type { PriceTrendInput } from '@/lib/collection/getPriceTrendsForPrintings';
import {
  getPriceTrendsForPrintings,
  priceTrendKey,
} from '@/lib/collection/getPriceTrendsForPrintings';
import type { PriceTrend } from '@/lib/collection/priceTrend';
import { toUtcDateString } from '@/lib/collection/printingPrices';

export const PRICE_TRENDS_CACHE_TAG = 'price-trends';

/** Safety TTL if cron revalidation fails; sync happens once daily via cron. */
const PRICE_TRENDS_REVALIDATE_SECONDS = 86_400;

function normalizeInputs(inputs: PriceTrendInput[]): PriceTrendInput[] {
  return [...inputs].sort((a, b) => {
    if (a.printingId !== b.printingId) return a.printingId - b.printingId;
    if (a.foil !== b.foil) return (a.foil ? 1 : 0) - (b.foil ? 1 : 0);
    return (a.etched ? 1 : 0) - (b.etched ? 1 : 0);
  });
}

export async function getPriceTrendsForPrintingsCached(
  inputs: PriceTrendInput[],
  options?: { now?: Date },
): Promise<Record<string, PriceTrend>> {
  if (inputs.length === 0) return {};

  const normalized = normalizeInputs(inputs);
  const now = options?.now ?? new Date();
  const todayUtc = toUtcDateString(now);
  const key = normalized.map(priceTrendKey).join('|');

  const cached = unstable_cache(
    () => getPriceTrendsForPrintings(normalized, { now }),
    ['price-trends', key, todayUtc],
    {
      revalidate: PRICE_TRENDS_REVALIDATE_SECONDS,
      tags: [PRICE_TRENDS_CACHE_TAG],
    },
  );

  return cached();
}
