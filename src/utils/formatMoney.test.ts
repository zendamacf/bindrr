import { describe, expect, it } from 'vitest';
import { formatMoney } from './formatMoney';

describe('formatMoney', () => {
  it('formats amounts with two decimal places and currency code', () => {
    expect(formatMoney(12.5, 'USD', { locale: 'en-US' })).toBe('$12.50');
  });

  it('returns null when amount is missing', () => {
    expect(formatMoney(null, 'USD')).toBeNull();
  });
});
