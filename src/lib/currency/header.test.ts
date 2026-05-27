import { describe, expect, it } from 'vitest';
import { getPreferredCurrencyFromRequest, PREFERRED_CURRENCY_HEADER } from './header';

describe('getPreferredCurrencyFromRequest', () => {
  it('reads the preferred currency header', () => {
    const request = new Request('http://localhost/api/collection', {
      headers: { [PREFERRED_CURRENCY_HEADER]: 'eur' },
    });
    expect(getPreferredCurrencyFromRequest(request)).toBe('EUR');
  });

  it('defaults to USD when the header is absent', () => {
    const request = new Request('http://localhost/api/collection');
    expect(getPreferredCurrencyFromRequest(request)).toBe('USD');
  });
});
