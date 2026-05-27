import { getExchangeRatesMap } from './exchangeRates';
import { DEFAULT_CURRENCY, normalizeCurrencyCode, type SupportedCurrencyCode } from './supported';

export async function getExchangeRate(currencyCode: SupportedCurrencyCode): Promise<number> {
  if (currencyCode === DEFAULT_CURRENCY) return 1;

  const rates = await getExchangeRatesMap();
  return rates[currencyCode] ?? 1;
}

export function convertUsdAmount(amount: number | null, rate: number): number | null {
  if (amount == null) return null;
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * rate * 100) / 100;
}

export function convertUsdPriceString(raw: string | null, rate: number): number | null {
  if (raw == null) return null;
  const amount = Number(raw);
  if (!Number.isFinite(amount)) return null;
  return convertUsdAmount(amount, rate);
}

export async function getExchangeRateForCode(code: string | null | undefined): Promise<{
  currencyCode: SupportedCurrencyCode;
  rate: number;
}> {
  const currencyCode = normalizeCurrencyCode(code);
  const rate = await getExchangeRate(currencyCode);
  return { currencyCode, rate };
}
