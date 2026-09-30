import { NextResponse } from 'next/server';
import { apiInternalErrorResponse } from '@/lib/api/errors';
import { runUpdateExchangeRatesJob } from '@/lib/cron/jobs';
import { unauthorizedCronResponse } from '@/lib/cron/verifyCronSecret';

export async function GET(request: Request) {
  const unauthorized = unauthorizedCronResponse(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await runUpdateExchangeRatesJob();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return apiInternalErrorResponse('Failed to update exchange rates', error, {
      route: '/api/cron/update-rates',
      method: 'GET',
    });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
