import { describe, expect, it } from 'vitest';
import { isPrintingPriceStale } from './refreshPrintingPrices';

describe('isPrintingPriceStale', () => {
  it('treats missing timestamp as stale', () => {
    expect(isPrintingPriceStale(null)).toBe(true);
  });

  it('treats prices older than 24h as stale', () => {
    const stale = new Date(Date.now() - 25 * 60 * 60 * 1000);
    expect(isPrintingPriceStale(stale)).toBe(true);
  });

  it('treats recent prices as fresh', () => {
    const fresh = new Date(Date.now() - 60 * 60 * 1000);
    expect(isPrintingPriceStale(fresh)).toBe(false);
  });
});
