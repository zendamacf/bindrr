import { NextResponse } from 'next/server';
import { apiInternalErrorResponse } from '@/lib/api/errors';
import { SUPPORTED_CURRENCIES } from '@/lib/currency/supported';
import { getUserPreferredCurrency, setUserPreferredCurrency } from '@/lib/currency/userPreference';
import { getSession } from '@/utils/auth/session';

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const preferredCurrencyCode = await getUserPreferredCurrency(user.id);
    return NextResponse.json({ preferredCurrencyCode, currencies: SUPPORTED_CURRENCIES });
  } catch (error) {
    return apiInternalErrorResponse('Failed to load preferences', error, {
      route: '/api/user/preferences',
      method: 'GET',
      userId: user.id,
    });
  }
}

export async function PATCH(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { preferredCurrencyCode?: string };
  try {
    body = (await request.json()) as { preferredCurrencyCode?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.preferredCurrencyCode || typeof body.preferredCurrencyCode !== 'string') {
    return NextResponse.json({ error: 'preferredCurrencyCode is required' }, { status: 400 });
  }

  try {
    const preferredCurrencyCode = await setUserPreferredCurrency(
      user.id,
      body.preferredCurrencyCode,
    );
    return NextResponse.json({ preferredCurrencyCode });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unsupported currency') {
      return NextResponse.json({ error: 'Unsupported currency' }, { status: 400 });
    }
    return apiInternalErrorResponse('Failed to update preferences', error, {
      route: '/api/user/preferences',
      method: 'PATCH',
      userId: user.id,
    });
  }
}
