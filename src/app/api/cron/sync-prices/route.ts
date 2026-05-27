import { NextResponse } from 'next/server';
import { apiInternalErrorResponse } from '@/lib/api/errors';
import { invalidatePriceTrendsCache } from '@/lib/cache/invalidatePriceTrends';
import { syncCollectionPrintingPrices } from '@/lib/collection/syncPrintingPrices';
import { unauthorizedCronResponse } from '@/lib/cron/verifyCronSecret';

/** Hobby plan max; sync processes up to PRICE_SYNC_MAX_BATCHES_PER_RUN Scryfall batches per run. */
export const maxDuration = 300;

export async function GET(request: Request) {
  const unauthorized = unauthorizedCronResponse(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await syncCollectionPrintingPrices();
    invalidatePriceTrendsCache();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return apiInternalErrorResponse('Failed to sync printing prices', error, {
      route: '/api/cron/sync-prices',
      method: 'GET',
    });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
