export const DEFAULT_CURRENCY = 'USD' as const;

/** Fiat currencies offered in the currency selector (v1). */
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'CAD', label: 'Canadian Dollar' },
  { code: 'AUD', label: 'Australian Dollar' },
  { code: 'NZD', label: 'New Zealand Dollar' },
  { code: 'JPY', label: 'Japanese Yen' },
  { code: 'CHF', label: 'Swiss Franc' },
  { code: 'SEK', label: 'Swedish Krona' },
  { code: 'NOK', label: 'Norwegian Krone' },
  { code: 'DKK', label: 'Danish Krone' },
  { code: 'BRL', label: 'Brazilian Real' },
] as const;

export type SupportedCurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]['code'];

const SUPPORTED_SET = new Set<string>(SUPPORTED_CURRENCIES.map((c) => c.code));

export function isSupportedCurrencyCode(code: string): code is SupportedCurrencyCode {
  return SUPPORTED_SET.has(code.toUpperCase());
}

export function normalizeCurrencyCode(code: string | null | undefined): SupportedCurrencyCode {
  const upper = (code ?? DEFAULT_CURRENCY).toUpperCase();
  if (isSupportedCurrencyCode(upper)) return upper;
  return DEFAULT_CURRENCY;
}

export function supportedCurrencyLabel(code: SupportedCurrencyCode): string {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code)?.label ?? code;
}
