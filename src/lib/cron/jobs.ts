import { invalidateExchangeRatesCache } from '@/lib/cache/invalidateExchangeRates';
import { invalidatePriceTrendsCache } from '@/lib/cache/invalidatePriceTrends';
import { syncCollectionPrintingPrices } from '@/lib/collection/syncPrintingPrices';
import { updateExchangeRates } from '@/lib/exchange-rates/updateExchangeRates';

export async function runSyncCollectionPricesJob() {
  const result = await syncCollectionPrintingPrices();
  invalidatePriceTrendsCache();
  return result;
}

export async function runUpdateExchangeRatesJob() {
  const result = await updateExchangeRates();
  invalidateExchangeRatesCache();
  return result;
}
