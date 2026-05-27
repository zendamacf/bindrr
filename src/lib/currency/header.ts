import { normalizeCurrencyCode, type SupportedCurrencyCode } from './supported';

export const PREFERRED_CURRENCY_HEADER = 'X-Preferred-Currency';

export function getPreferredCurrencyFromRequest(request: Request): SupportedCurrencyCode {
  return normalizeCurrencyCode(request.headers.get(PREFERRED_CURRENCY_HEADER));
}
