import { describe, expect, it } from 'vitest';
import { isValidQuantity, toQuantityInput } from './quantityInput';

describe('toQuantityInput', () => {
  it('keeps a number', () => {
    expect(toQuantityInput(3)).toBe(3);
  });

  it('returns an empty value for an empty field and for values that are not numbers', () => {
    expect(toQuantityInput('')).toBe('');
    expect(toQuantityInput('12')).toBe('');
    expect(toQuantityInput(Number.NaN)).toBe('');
    expect(toQuantityInput(Number.POSITIVE_INFINITY)).toBe('');
  });
});

describe('isValidQuantity', () => {
  it('accepts a whole number of 1 or more', () => {
    expect(isValidQuantity(1)).toBe(true);
    expect(isValidQuantity(40)).toBe(true);
  });

  it('rejects an empty value, 0, negative numbers and fractions', () => {
    expect(isValidQuantity('')).toBe(false);
    expect(isValidQuantity(0)).toBe(false);
    expect(isValidQuantity(-1)).toBe(false);
    expect(isValidQuantity(1.5)).toBe(false);
  });

  it('checks the maximum', () => {
    expect(isValidQuantity(3, 3)).toBe(true);
    expect(isValidQuantity(4, 3)).toBe(false);
  });
});
