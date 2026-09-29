import { beforeEach, describe, expect, it, vi } from 'vitest';

const syncCollectionPrintingPrices = vi.fn();
const updateExchangeRates = vi.fn();
const invalidatePriceTrendsCache = vi.fn();
const invalidateExchangeRatesCache = vi.fn();

vi.mock('@/lib/collection/syncPrintingPrices', () => ({
  syncCollectionPrintingPrices,
}));
vi.mock('@/lib/exchange-rates/updateExchangeRates', () => ({
  updateExchangeRates,
}));
vi.mock('@/lib/cache/invalidatePriceTrends', () => ({
  invalidatePriceTrendsCache,
}));
vi.mock('@/lib/cache/invalidateExchangeRates', () => ({
  invalidateExchangeRatesCache,
}));

describe('cron jobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    syncCollectionPrintingPrices.mockResolvedValue({ batches: 1 });
    updateExchangeRates.mockResolvedValue({ updated: 2 });
  });

  it('runSyncCollectionPricesJob syncs prices and invalidates trends cache', async () => {
    const { runSyncCollectionPricesJob } = await import('./jobs');
    const result = await runSyncCollectionPricesJob();
    expect(syncCollectionPrintingPrices).toHaveBeenCalledOnce();
    expect(invalidatePriceTrendsCache).toHaveBeenCalledOnce();
    expect(result).toEqual({ batches: 1 });
  });

  it('runUpdateExchangeRatesJob updates rates and invalidates exchange cache', async () => {
    const { runUpdateExchangeRatesJob } = await import('./jobs');
    const result = await runUpdateExchangeRatesJob();
    expect(updateExchangeRates).toHaveBeenCalledOnce();
    expect(invalidateExchangeRatesCache).toHaveBeenCalledOnce();
    expect(result).toEqual({ updated: 2 });
  });
});
