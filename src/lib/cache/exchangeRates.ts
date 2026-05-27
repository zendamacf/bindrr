import 'server-only';

import { inArray } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import {
  DEFAULT_CURRENCY,
  isSupportedCurrencyCode,
  SUPPORTED_CURRENCIES,
  type SupportedCurrencyCode,
} from '@/lib/currency/supported';
import { db } from '@/lib/db';
import { currencies } from '@/lib/db/schema';

export const EXCHANGE_RATES_CACHE_TAG = 'exchange-rates';

/** Safety TTL if cron revalidation fails; rates are refreshed daily via cron. */
const EXCHANGE_RATES_REVALIDATE_SECONDS = 86_400;

const SUPPORTED_CODES = SUPPORTED_CURRENCIES.map((c) => c.code);

function defaultRatesMap(): Record<SupportedCurrencyCode, number> {
  const rates = {} as Record<SupportedCurrencyCode, number>;
  for (const code of SUPPORTED_CODES) {
    rates[code] = 1;
  }
  return rates;
}

/** Loads supported currency rates from the database (uncached). */
export async function loadExchangeRatesFromDb(): Promise<Record<SupportedCurrencyCode, number>> {
  const rates = defaultRatesMap();
  rates[DEFAULT_CURRENCY] = 1;

  const rows = await db
    .select({ code: currencies.code, exchangerate: currencies.exchangerate })
    .from(currencies)
    .where(inArray(currencies.code, [...SUPPORTED_CODES]));

  for (const row of rows) {
    if (!isSupportedCurrencyCode(row.code)) continue;
    const parsed = Number(row.exchangerate);
    rates[row.code] = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }

  return rates;
}

const getCachedExchangeRates = unstable_cache(loadExchangeRatesFromDb, ['exchange-rates-map'], {
  revalidate: EXCHANGE_RATES_REVALIDATE_SECONDS,
  tags: [EXCHANGE_RATES_CACHE_TAG],
});

export async function getExchangeRatesMap(): Promise<Record<SupportedCurrencyCode, number>> {
  return getCachedExchangeRates();
}
