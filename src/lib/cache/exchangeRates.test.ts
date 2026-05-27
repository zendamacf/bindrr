import { eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { currencies } from '@/lib/db/schema';
import { EXCHANGE_RATES_CACHE_TAG, loadExchangeRatesFromDb } from './exchangeRates';
import { invalidateExchangeRatesCache } from './invalidateExchangeRates';

describe('loadExchangeRatesFromDb', () => {
  it('loads supported codes in one query', async () => {
    const [existing] = await db
      .select({ exchangerate: currencies.exchangerate })
      .from(currencies)
      .where(eq(currencies.code, 'EUR'))
      .limit(1);

    if (existing) {
      await db.update(currencies).set({ exchangerate: '2' }).where(eq(currencies.code, 'EUR'));
    } else {
      await db.insert(currencies).values({ code: 'EUR', exchangerate: '2' });
    }

    try {
      const rates = await loadExchangeRatesFromDb();
      expect(rates.USD).toBe(1);
      expect(rates.EUR).toBe(2);
    } finally {
      if (existing) {
        await db
          .update(currencies)
          .set({ exchangerate: existing.exchangerate })
          .where(eq(currencies.code, 'EUR'));
      } else {
        await db.delete(currencies).where(eq(currencies.code, 'EUR'));
      }
    }
  });

  it('defaults missing supported codes to 1', async () => {
    const [existing] = await db
      .select({ id: currencies.id })
      .from(currencies)
      .where(eq(currencies.code, 'DKK'))
      .limit(1);

    if (existing) {
      await db.delete(currencies).where(eq(currencies.code, 'DKK'));
    }

    try {
      const rates = await loadExchangeRatesFromDb();
      expect(rates.DKK).toBe(1);
    } finally {
      if (existing) {
        await db.insert(currencies).values({ code: 'DKK', exchangerate: '6.5' });
      }
    }
  });
});

describe('invalidateExchangeRatesCache', () => {
  it('revalidates the exchange rates cache tag', () => {
    invalidateExchangeRatesCache();
    expect(revalidateTag).toHaveBeenCalledWith(EXCHANGE_RATES_CACHE_TAG, { expire: 0 });
  });
});
