import { NextResponse } from 'next/server';
import { apiInternalErrorResponse } from '@/lib/api/errors';
import { syncCollectionPrintingPrices } from '@/lib/collection/syncPrintingPrices';
import { unauthorizedCronResponse } from '@/lib/cron/verifyCronSecret';

export async function GET(request: Request) {
  const unauthorized = unauthorizedCronResponse(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await syncCollectionPrintingPrices();
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
