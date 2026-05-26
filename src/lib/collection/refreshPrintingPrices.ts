import {
  applyPrintingPricesByScryfallId,
  type PriceDbExecutor,
} from '@/lib/collection/printingPrices';
import { db } from '@/lib/db';
import { scryfallGetCardById, scryfallPricesFromCard } from '@/lib/scryfall/client';

const PRICE_STALE_MS = 24 * 60 * 60 * 1000;

export function isPrintingPriceStale(pricesUpdatedAt: Date | null, now = Date.now()): boolean {
  if (!pricesUpdatedAt) return true;
  return now - pricesUpdatedAt.getTime() >= PRICE_STALE_MS;
}

export async function refreshPrintingPricesByScryfallId(
  scryfallId: string,
  executor: PriceDbExecutor = db,
) {
  const card = await scryfallGetCardById(scryfallId);
  const prices = scryfallPricesFromCard(card);
  await applyPrintingPricesByScryfallId(scryfallId, prices, new Date(), executor);
}
