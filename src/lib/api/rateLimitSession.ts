import type { NextResponse } from 'next/server';
import { type ApiRateLimitTier, checkApiRateLimit } from '@/lib/rate-limit/apiGuard';
import { getSession } from '@/utils/auth/session';
import type { AuthUser } from '@/utils/auth/types';

export async function rateLimitForRequest(
  request: Request,
  tier: ApiRateLimitTier = 'default',
): Promise<{ user: AuthUser | null; blocked: NextResponse | null }> {
  const user = await getSession();
  return {
    user,
    blocked: checkApiRateLimit(request, user?.id ?? null, tier),
  };
}
