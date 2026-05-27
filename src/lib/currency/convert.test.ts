import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { currencies } from '@/lib/db/schema';
import { convertUsdAmount, convertUsdPriceString, getExchangeRate } from './convert';

const TEST_CODE = 'BRL';

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
  let previousBrlRate: string | null = null;

  beforeEach(async () => {
    const [existing] = await db
      .select({ exchangerate: currencies.exchangerate })
      .from(currencies)
      .where(eq(currencies.code, TEST_CODE))
      .limit(1);

    previousBrlRate = existing?.exchangerate ?? null;

    if (existing) {
      await db.update(currencies).set({ exchangerate: '1.5' }).where(eq(currencies.code, TEST_CODE));
    } else {
      await db.insert(currencies).values({ code: TEST_CODE, exchangerate: '1.5' });
    }
  });

  afterEach(async () => {
    if (previousBrlRate != null) {
      await db
        .update(currencies)
        .set({ exchangerate: previousBrlRate })
        .where(eq(currencies.code, TEST_CODE));
    } else {
      await db.delete(currencies).where(eq(currencies.code, TEST_CODE));
    }
  });

  it('returns 1 for USD', async () => {
    await expect(getExchangeRate('USD')).resolves.toBe(1);
  });

  it('loads rate from the database', async () => {
    await expect(getExchangeRate(TEST_CODE)).resolves.toBe(1.5);
  });

  it('falls back to 1 when rate is missing', async () => {
    await db.delete(currencies).where(eq(currencies.code, 'DKK'));
    await expect(getExchangeRate('DKK')).resolves.toBe(1);
  });
});
