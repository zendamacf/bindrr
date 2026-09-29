import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import type { RateLimitResult } from './store';

export function rateLimitExceededResponse(
  result: RateLimitResult,
  context: { scope: string; key: string },
): NextResponse {
  logger.warn(
    {
      scope: context.scope,
      key: context.key,
      limit: result.limit,
      retryAfterSec: result.retryAfterSec,
    },
    '[rate-limit] limit exceeded',
  );

  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSec),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
      },
    },
  );
}
