import { describe, expect, it } from 'vitest';
import {
  buildChartSeries,
  chartDataFromHistory,
  formatChartAxisDate,
  priceHistoryDaysFromRange,
} from './priceHistoryChartUtils';

const emptySeries = {
  nonfoil: { hasData: false },
  foil: { hasData: false },
  etched: { hasData: false },
};

describe('priceHistoryDaysFromRange', () => {
  it('maps UI range values to API day counts', () => {
    expect(priceHistoryDaysFromRange('30')).toBe(30);
    expect(priceHistoryDaysFromRange('60')).toBe(60);
    expect(priceHistoryDaysFromRange('90')).toBe(90);
    expect(priceHistoryDaysFromRange('365')).toBe(365);
    expect(priceHistoryDaysFromRange('all')).toBeUndefined();
  });
});

describe('formatChartAxisDate', () => {
  it('formats ISO dates for the chart axis', () => {
    expect(formatChartAxisDate('2026-01-15')).toMatch(/Jan/);
  });

  it('returns the input when parsing fails', () => {
    expect(formatChartAxisDate('not-a-date')).toBe('not-a-date');
  });
});

describe('buildChartSeries', () => {
  it('includes only finishes with historical data', () => {
    const series = buildChartSeries({
      currencyCode: 'USD',
      points: [],
      series: {
        nonfoil: { hasData: true },
        foil: { hasData: false },
        etched: { hasData: true },
      },
    });

    expect(series.map((s) => s.name)).toEqual(['nonfoil', 'etched']);
  });

  it('marks the current finish in the legend label', () => {
    const series = buildChartSeries(
      {
        currencyCode: 'USD',
        points: [],
        series: {
          ...emptySeries,
          nonfoil: { hasData: true },
          foil: { hasData: true },
        },
      },
      'foil',
    );

    expect(series.find((s) => s.name === 'foil')?.label).toBe('Foil (yours)');
    expect(series.find((s) => s.name === 'nonfoil')?.label).toBe('Non-foil');
  });
});

describe('chartDataFromHistory', () => {
  it('formats point dates for display', () => {
    const data = chartDataFromHistory({
      currencyCode: 'USD',
      points: [{ date: '2026-03-01', nonfoil: 1, foil: null, etched: null }],
      series: { ...emptySeries, nonfoil: { hasData: true } },
    });

    expect(data[0]?.date).toMatch(/Mar/);
    expect(data[0]?.nonfoil).toBe(1);
  });
});
