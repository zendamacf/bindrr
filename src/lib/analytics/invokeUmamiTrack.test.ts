import { describe, expect, it, vi } from 'vitest';
import { invokeUmamiTrack, sanitizeUmamiEventData } from './invokeUmamiTrack';

describe('sanitizeUmamiEventData', () => {
  it('drops non-scalar values', () => {
    expect(
      sanitizeUmamiEventData({
        finish: 'foil',
        nested: { bad: true },
        fn: () => {},
      }),
    ).toEqual({ finish: 'foil' });
  });

  it('returns undefined when nothing valid remains', () => {
    expect(sanitizeUmamiEventData({ nested: {} })).toBeUndefined();
  });
});

describe('invokeUmamiTrack', () => {
  it('no-ops without a tracker', () => {
    expect(() => invokeUmamiTrack(undefined, 'collection_add')).not.toThrow();
  });

  it('tracks name-only and name with sanitized data', () => {
    const track = vi.fn();
    invokeUmamiTrack({ track }, 'currency_change', { currency: 'EUR', extra: undefined });
    expect(track).toHaveBeenCalledWith('currency_change', { currency: 'EUR' });

    track.mockClear();
    invokeUmamiTrack({ track }, 'login_failed');
    expect(track).toHaveBeenCalledWith('login_failed');
  });

  it('swallows tracker errors', () => {
    const track = vi.fn(() => {
      throw new Error('network');
    });
    expect(() => invokeUmamiTrack({ track }, 'logout')).not.toThrow();
  });
});
