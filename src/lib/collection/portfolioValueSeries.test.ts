import { describe, expect, it } from 'vitest';
import {
  buildPortfolioValueSeries,
  collectHistoryDatesInWindow,
  forwardFilledPriceOnDate,
  type PortfolioHolding,
} from './portfolioValueSeries';
import type { PriceHistoryPoint } from './types';

describe('forwardFilledPriceOnDate', () => {
  const points: PriceHistoryPoint[] = [
    { date: '2026-01-01', nonfoil: 1, foil: 10, etched: null },
    { date: '2026-01-03', nonfoil: 2, foil: null, etched: null },
  ];

  it('returns the latest price on or before the date for the finish', () => {
    expect(forwardFilledPriceOnDate(points, '2026-01-02', false, false)).toBe(1);
    expect(forwardFilledPriceOnDate(points, '2026-01-03', false, false)).toBe(2);
    expect(forwardFilledPriceOnDate(points, '2026-01-02', true, false)).toBe(10);
  });

  it('returns null when no price exists yet', () => {
    expect(forwardFilledPriceOnDate(points, '2025-12-31', false, false)).toBeNull();
  });
});

describe('collectHistoryDatesInWindow', () => {
  it('collects sorted dates at or after the cutoff', () => {
    const map = new Map<number, PriceHistoryPoint[]>([
      [
        1,
        [
          { date: '2026-01-01', nonfoil: 1, foil: null, etched: null },
          { date: '2026-01-10', nonfoil: 2, foil: null, etched: null },
        ],
      ],
      [2, [{ date: '2026-01-05', nonfoil: 3, foil: null, etched: null }]],
    ]);

    expect(collectHistoryDatesInWindow(map, '2026-01-04')).toEqual(['2026-01-05', '2026-01-10']);
  });
});

describe('buildPortfolioValueSeries', () => {
  it('sums quantity × forward-filled prices per day', () => {
    const holdings: PortfolioHolding[] = [
      { printingId: 1, quantity: 2, foil: false, etched: false },
      { printingId: 2, quantity: 1, foil: false, etched: false },
    ];
    const history = new Map<number, PriceHistoryPoint[]>([
      [
        1,
        [
          { date: '2026-01-01', nonfoil: 1, foil: null, etched: null },
          { date: '2026-01-02', nonfoil: 2, foil: null, etched: null },
        ],
      ],
      [2, [{ date: '2026-01-02', nonfoil: 5, foil: null, etched: null }]],
    ]);

    expect(
      buildPortfolioValueSeries(holdings, history, ['2026-01-01', '2026-01-02'], (usd) => usd),
    ).toEqual([
      { date: '2026-01-01', value: 2 },
      { date: '2026-01-02', value: 9 },
    ]);
  });

  it('returns an empty series when there are no dates', () => {
    expect(buildPortfolioValueSeries([], new Map(), [], (usd) => usd)).toEqual([]);
  });
});
