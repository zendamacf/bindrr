type Bucket = {
  count: number;
  windowStartMs: number;
};

const buckets = new Map<string, Bucket>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanupMs = Date.now();

function cleanupExpired(nowMs: number, windowMs: number): void {
  if (nowMs - lastCleanupMs < CLEANUP_INTERVAL_MS) return;
  lastCleanupMs = nowMs;
  for (const [key, bucket] of buckets) {
    if (nowMs - bucket.windowStartMs >= windowMs) {
      buckets.delete(key);
    }
  }
}

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSec: number;
};

/**
 * Fixed-window counter. Good enough for single-instance self-hosting;
 * use a shared store (Redis) if you scale horizontally.
 */
export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  nowMs = Date.now(),
): RateLimitResult {
  cleanupExpired(nowMs, windowMs);

  const existing = buckets.get(key);
  if (!existing || nowMs - existing.windowStartMs >= windowMs) {
    buckets.set(key, { count: 1, windowStartMs: nowMs });
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      retryAfterSec: Math.ceil(windowMs / 1000),
    };
  }

  if (existing.count >= limit) {
    const retryAfterMs = windowMs - (nowMs - existing.windowStartMs);
    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  existing.count += 1;
  const retryAfterMs = windowMs - (nowMs - existing.windowStartMs);
  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)),
  };
}

/** Test helper — clears in-memory counters between tests. */
export function resetRateLimitStore(): void {
  buckets.clear();
  lastCleanupMs = Date.now();
}
