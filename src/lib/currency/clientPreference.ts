import { PREFERRED_CURRENCY_STORAGE_KEY } from './storage';
import {
  isSupportedCurrencyCode,
  normalizeCurrencyCode,
  type SupportedCurrencyCode,
} from './supported';

let inMemoryPreferredCurrency: SupportedCurrencyCode | null = null;

export function readClientPreferredCurrency(): SupportedCurrencyCode {
  if (inMemoryPreferredCurrency) return inMemoryPreferredCurrency;

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(PREFERRED_CURRENCY_STORAGE_KEY);
    if (stored && isSupportedCurrencyCode(stored)) {
      return normalizeCurrencyCode(stored);
    }
  }

  return 'USD';
}

export function setClientPreferredCurrency(code: SupportedCurrencyCode): void {
  inMemoryPreferredCurrency = code;
  if (typeof window !== 'undefined') {
    localStorage.setItem(PREFERRED_CURRENCY_STORAGE_KEY, code);
  }
}
