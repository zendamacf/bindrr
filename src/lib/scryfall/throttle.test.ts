import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  resetScryfallThrottle,
  retryAfterMsFromHeader,
  SCRYFALL_REQUEST_INTERVAL_MS,
  ScryfallRateLimitError,
  throttledScryfall,
  waitForScryfallSlot,
} from './throttle';

describe('scryfall throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetScryfallThrottle();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts the first request at once and spaces the next ones', async () => {
    const starts: number[] = [];
    const run = async () => {
      await waitForScryfallSlot();
      starts.push(Date.now());
    };

    const begin = Date.now();
    const all = Promise.all([run(), run(), run()]);
    await vi.advanceTimersByTimeAsync(SCRYFALL_REQUEST_INTERVAL_MS * 3);
    await all;

    expect(starts.map((time) => time - begin)).toEqual([
      0,
      SCRYFALL_REQUEST_INTERVAL_MS,
      SCRYFALL_REQUEST_INTERVAL_MS * 2,
    ]);
  });

  it('waits and tries one more time after HTTP 429', async () => {
    const request = vi
      .fn()
      .mockRejectedValueOnce(new ScryfallRateLimitError(1500))
      .mockResolvedValueOnce('ok');

    const result = throttledScryfall(request);
    await vi.advanceTimersByTimeAsync(1500 + SCRYFALL_REQUEST_INTERVAL_MS);

    await expect(result).resolves.toBe('ok');
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('throws if the second try also gets HTTP 429', async () => {
    const request = vi.fn().mockRejectedValue(new ScryfallRateLimitError(100));

    const result = throttledScryfall(request);
    const assertion = expect(result).rejects.toBeInstanceOf(ScryfallRateLimitError);
    await vi.advanceTimersByTimeAsync(1000);

    await assertion;
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('does not retry other errors', async () => {
    const request = vi.fn().mockRejectedValue(new Error('boom'));
    await expect(throttledScryfall(request)).rejects.toThrow('boom');
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('reads the Retry-After header', () => {
    expect(retryAfterMsFromHeader('3')).toBe(3000);
    expect(retryAfterMsFromHeader('999')).toBe(10_000);
    expect(retryAfterMsFromHeader(null)).toBe(2000);
    expect(retryAfterMsFromHeader('soon')).toBe(2000);
  });
});
