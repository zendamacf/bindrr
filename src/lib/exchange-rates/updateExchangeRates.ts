import { fetchLatestExchangeRates } from './openexchangerates';
import { upsertCurrencyRates } from './upsertRates';

export async function updateExchangeRates(): Promise<{ updated: number }> {
  const rates = await fetchLatestExchangeRates();
  const updated = await upsertCurrencyRates(rates);
  return { updated };
}
