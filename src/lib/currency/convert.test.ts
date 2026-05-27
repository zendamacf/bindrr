import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { currencies } from '@/lib/db/schema';
import { convertUsdAmount, convertUsdPriceString, getExchangeRate } from './convert';
import type { SupportedCurrencyCode } from './supported';

const TEST_CODE = 'ZZY';

describe('convertUsdAmount', () => {
  it('multiplies by rate and rounds to two decimals', () => {
    expect(convertUsdAmount(10, 1.234)).toBe(12.34);
    expect(convertUsdAmount(null, 2)).toBeNull();
  });
});

describe('convertUsdPriceString', () => {
  it('parses USD strings from Scryfall', () => {
    expect(convertUsdPriceString('1.23', 2)).toBe(2.46);
    expect(convertUsdPriceString(null, 2)).toBeNull();
  });
});

describe('getExchangeRate', () => {
  beforeEach(async () => {
    await db.insert(currencies).values({ code: TEST_CODE, exchangerate: '1.5' });
  });

  afterEach(async () => {
    await db.delete(currencies).where(eq(currencies.code, TEST_CODE));
  });

  it('returns 1 for USD', async () => {
    await expect(getExchangeRate('USD')).resolves.toBe(1);
  });

  it('loads rate from the database', async () => {
    await expect(getExchangeRate(TEST_CODE as SupportedCurrencyCode)).resolves.toBe(1.5);
  });

  it('falls back to 1 when rate is missing', async () => {
    await db.delete(currencies).where(eq(currencies.code, 'PLN'));
    // @ts-expect-error - PLN is not a supported currency code
    await expect(getExchangeRate('PLN')).resolves.toBe(1);
  });
});
