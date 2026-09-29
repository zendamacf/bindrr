import type { NextResponse } from 'next/server';
import { getClientIpFromRequest } from './clientIp';
import { getRateLimitConfig } from './config';
import { rateLimitExceededResponse } from './responses';
import { consumeRateLimit } from './store';

export type ApiRateLimitTier = 'default' | 'search';

export function checkApiRateLimit(
  request: Request,
  userId: number | null,
  tier: ApiRateLimitTier = 'default',
): NextResponse | null {
  if (tier === 'search') {
    if (userId == null) return null;
    const { maxAttempts, windowMs } = getRateLimitConfig().search;
    const key = `search:user:${userId}`;
    const result = consumeRateLimit(key, maxAttempts, windowMs);
    if (!result.allowed) {
      return rateLimitExceededResponse(result, { scope: 'search', key });
    }
    return null;
  }

  const ip = getClientIpFromRequest(request);
  const config = getRateLimitConfig();
  const policy = userId != null ? config.apiAuthenticated : config.apiAnonymous;
  const key = userId != null ? `api:user:${userId}` : `api:ip:${ip}`;
  const result = consumeRateLimit(key, policy.maxAttempts, policy.windowMs);
  if (!result.allowed) {
    return rateLimitExceededResponse(result, { scope: 'api', key });
  }
  return null;
}
