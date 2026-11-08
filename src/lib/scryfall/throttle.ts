/** Time between two Scryfall requests. Scryfall allows about 10 requests each second. */
export const SCRYFALL_REQUEST_INTERVAL_MS = 120;

let nextSlotAt = 0;

/**
 * Waits for the next free time to send a request to Scryfall.
 * All callers in this process share the same times, so imports that run at the same time
 * together stay under the limit of Scryfall.
 */
export async function waitForScryfallSlot(): Promise<void> {
  const now = Date.now();
  const start = Math.max(now, nextSlotAt);
  nextSlotAt = start + SCRYFALL_REQUEST_INTERVAL_MS;
  const wait = start - now;
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
}

/** For tests only. */
export function resetScryfallThrottle(): void {
  nextSlotAt = 0;
}

/** Scryfall answered with HTTP 429 (too many requests). */
export class ScryfallRateLimitError extends Error {
  constructor(readonly retryAfterMs: number) {
    super('Scryfall rate limit reached');
    this.name = 'ScryfallRateLimitError';
  }
}

const DEFAULT_RETRY_AFTER_MS = 2000;
const MAX_RETRY_AFTER_MS = 10_000;

export function retryAfterMsFromHeader(value: string | null): number {
  const seconds = Number(value);
  if (!value || !Number.isFinite(seconds) || seconds <= 0) return DEFAULT_RETRY_AFTER_MS;
  return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS);
}

/**
 * Runs the request after a free time. If Scryfall answers with HTTP 429,
 * it waits and tries one more time.
 */
export async function throttledScryfall<T>(request: () => Promise<T>): Promise<T> {
  await waitForScryfallSlot();
  try {
    return await request();
  } catch (error) {
    if (!(error instanceof ScryfallRateLimitError)) throw error;
    await new Promise((resolve) => setTimeout(resolve, error.retryAfterMs));
    await waitForScryfallSlot();
    return request();
  }
}
