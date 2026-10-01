import { describe, expect, it } from 'vitest';
import { formatLogChange, formatLogOccurred } from './formatLogChange';

describe('formatLogChange', () => {
  it('prefixes positive changes with a plus sign', () => {
    expect(formatLogChange(3)).toBe('+3');
  });

  it('leaves zero and negative values unchanged', () => {
    expect(formatLogChange(0)).toBe('0');
    expect(formatLogChange(-2)).toBe('-2');
  });
});

describe('formatLogOccurred', () => {
  it('formats ISO timestamps for display', () => {
    const formatted = formatLogOccurred('2024-06-01T12:00:00.000Z');
    expect(formatted).toBe(new Date('2024-06-01T12:00:00.000Z').toLocaleString());
  });
});
