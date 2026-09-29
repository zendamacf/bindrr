import { afterEach, describe, expect, it } from 'vitest';
import { consumeRateLimit, peekRateLimit, resetRateLimitStore } from './store';

describe('consumeRateLimit', () => {
  afterEach(() => {
    resetRateLimitStore();
  });

  it('allows requests under the limit', () => {
    const first = consumeRateLimit('test', 3, 60_000, 1_000);
    const second = consumeRateLimit('test', 3, 60_000, 2_000);

    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(2);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(1);
  });

  it('blocks when the limit is exceeded', () => {
    consumeRateLimit('blocked', 2, 60_000, 5_000);
    consumeRateLimit('blocked', 2, 60_000, 6_000);
    const third = consumeRateLimit('blocked', 2, 60_000, 7_000);

    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
    expect(third.retryAfterSec).toBeGreaterThan(0);
  });

  it('peeks without incrementing the counter', () => {
    consumeRateLimit('peek', 2, 60_000, 1_000);
    const peek = peekRateLimit('peek', 2, 60_000, 2_000);
    const afterConsume = consumeRateLimit('peek', 2, 60_000, 3_000);

    expect(peek.allowed).toBe(true);
    expect(peek.remaining).toBe(1);
    expect(afterConsume.remaining).toBe(0);
  });

  it('resets the window after it expires', () => {
    consumeRateLimit('window', 1, 1_000, 0);
    const blocked = consumeRateLimit('window', 1, 1_000, 500);
    const allowed = consumeRateLimit('window', 1, 1_000, 1_500);

    expect(blocked.allowed).toBe(false);
    expect(allowed.allowed).toBe(true);
  });
});
