import { describe, expect, it } from 'vitest';
import { buildPriceTrend, PRICE_TREND_DAYS, priceFromHistoryPoint } from './priceTrend';
import type { PriceHistoryPoint } from './types';

function point(fields: Partial<PriceHistoryPoint>): PriceHistoryPoint {
  return {
    date: '2026-01-01',
    nonfoil: null,
    foil: null,
    etched: null,
    ...fields,
  };
}

describe('priceFromHistoryPoint', () => {
  it('selects etched when etched=true', () => {
    const p = point({ nonfoil: 1, foil: 2, etched: 3 });
    expect(priceFromHistoryPoint(p, false, true)).toBe(3);
  });

  it('selects foil when foil=true', () => {
    const p = point({ nonfoil: 1, foil: 2, etched: 3 });
    expect(priceFromHistoryPoint(p, true, false)).toBe(2);
  });

  it('selects nonfoil when neither foil nor etched', () => {
    const p = point({ nonfoil: 1, foil: 2, etched: 3 });
    expect(priceFromHistoryPoint(p, false, false)).toBe(1);
  });
});

describe('buildPriceTrend', () => {
  it('includes windowDays in the result', () => {
    const res = buildPriceTrend([point({ nonfoil: 1, date: '2026-01-01' })], false, false);
    expect(res.windowDays).toBe(PRICE_TREND_DAYS);
  });

  it('returns null changePercent when there is only one point', () => {
    const res = buildPriceTrend([point({ nonfoil: 10, date: '2026-01-01' })], false, false);
    expect(res.hasHistory).toBe(false);
    expect(res.changePercent).toBeNull();
  });

  it('computes positive percent change (rising)', () => {
    const res = buildPriceTrend(
      [point({ nonfoil: 100, date: '2026-01-01' }), point({ nonfoil: 110, date: '2026-01-02' })],
      false,
      false,
    );

    expect(res.hasHistory).toBe(true);
    expect(res.changePercent).toBe(10);
  });

  it('computes negative percent change (falling)', () => {
    const res = buildPriceTrend(
      [point({ nonfoil: 100, date: '2026-01-01' }), point({ nonfoil: 90, date: '2026-01-02' })],
      false,
      false,
    );

    expect(res.hasHistory).toBe(true);
    expect(res.changePercent).toBe(-10);
  });

  it('returns 0 for flat trends', () => {
    const res = buildPriceTrend(
      [point({ nonfoil: 100, date: '2026-01-01' }), point({ nonfoil: 100, date: '2026-01-02' })],
      false,
      false,
    );

    expect(res.hasHistory).toBe(true);
    expect(res.changePercent).toBe(0);
  });

  it('ignores null gaps in the middle (null gaps)', () => {
    const res = buildPriceTrend(
      [
        point({ nonfoil: 100, date: '2026-01-01' }),
        point({ nonfoil: null, date: '2026-01-02' }),
        point({ nonfoil: 110, date: '2026-01-03' }),
      ],
      false,
      false,
    );

    expect(res.hasHistory).toBe(true);
    expect(res.changePercent).toBe(10);
  });

  it('returns null changePercent when firstPrice is zero', () => {
    const res = buildPriceTrend(
      [point({ nonfoil: 0, date: '2026-01-01' }), point({ nonfoil: 50, date: '2026-01-02' })],
      false,
      false,
    );

    expect(res.hasHistory).toBe(true);
    expect(res.changePercent).toBeNull();
  });
});
