import { NextResponse } from 'next/server';
import { unauthorizedCronResponse } from '@/lib/cron/verifyCronSecret';
import { updateExchangeRates } from '@/lib/exchange-rates/updateExchangeRates';

export async function GET(request: Request) {
  const unauthorized = unauthorizedCronResponse(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await updateExchangeRates();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update exchange rates';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
