import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { printings } from '@/lib/db/schema';
import { scryfallGetCardById, scryfallPricesFromCard } from '@/lib/scryfall/client';

const PRICE_STALE_MS = 24 * 60 * 60 * 1000; // 24 hours

type DbExecutor = Pick<typeof db, 'update'>;

export function isPrintingPriceStale(pricesUpdatedAt: Date | null, now = Date.now()): boolean {
  if (!pricesUpdatedAt) return true;
  return now - pricesUpdatedAt.getTime() >= PRICE_STALE_MS;
}

export async function refreshPrintingPricesByScryfallId(
  scryfallId: string,
  executor: DbExecutor = db,
): Promise<void> {
  const card = await scryfallGetCardById(scryfallId);
  const prices = scryfallPricesFromCard(card);

  await executor
    .update(printings)
    .set({
      price: prices.price,
      foilprice: prices.foilprice,
      etchedprice: prices.etchedprice,
      pricesUpdatedAt: new Date(),
    })
    .where(eq(printings.scryfall_id, scryfallId));
}
