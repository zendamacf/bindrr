import { readClientPreferredCurrency } from '@/lib/currency/clientPreference';
import { PREFERRED_CURRENCY_HEADER } from '@/lib/currency/header';

/** Browser fetch wrapper that sends the user's preferred currency from {@link CurrencyProvider}. */
export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (!headers.has(PREFERRED_CURRENCY_HEADER)) {
    headers.set(PREFERRED_CURRENCY_HEADER, readClientPreferredCurrency());
  }
  return fetch(input, { ...init, headers });
}
