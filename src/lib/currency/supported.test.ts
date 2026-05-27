import { describe, expect, it } from 'vitest';
import { isSupportedCurrencyCode, normalizeCurrencyCode } from './supported';

describe('normalizeCurrencyCode', () => {
  it('returns supported codes unchanged', () => {
    expect(normalizeCurrencyCode('eur')).toBe('EUR');
  });

  it('falls back to USD for unknown codes', () => {
    expect(normalizeCurrencyCode('XXX')).toBe('USD');
    expect(normalizeCurrencyCode(null)).toBe('USD');
  });
});

describe('isSupportedCurrencyCode', () => {
  it('accepts v1 allowlist codes', () => {
    expect(isSupportedCurrencyCode('GBP')).toBe(true);
    expect(isSupportedCurrencyCode('TIX')).toBe(false);
  });
});
