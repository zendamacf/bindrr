import { ensurePrinting } from '@/lib/collection/ensurePrinting';
import { db } from '@/lib/db';
import { type ScryfallCard, scryfallSearchPrints } from '@/lib/scryfall/client';
import { DEFAULT_SCRYFALL_LANGUAGE } from '@/lib/scryfall/languages';

/** Builds a Scryfall query for the exact name of a card. */
export function exactNameQuery(name: string): string {
  return `!"${name.replace(/["\\]/g, '')}"`;
}

/**
 * Gets the English printings of a card from Scryfall.
 * If Scryfall fails, this function logs the error and returns no printings,
 * so that the entry still uses the printings that are already known.
 */
export async function fetchCardPrints(name: string): Promise<ScryfallCard[]> {
  try {
    return await scryfallSearchPrints(exactNameQuery(name), { lang: DEFAULT_SCRYFALL_LANGUAGE });
  } catch (error) {
    console.error('Failed to load printings for wishlist card', error);
    return [];
  }
}

/** Stores printings that came from Scryfall, so that their prices are known and synced. */
export async function storeCardPrints(prints: ScryfallCard[]): Promise<void> {
  if (prints.length === 0) return;
  await db.transaction(async (tx) => {
    for (const print of prints) {
      await ensurePrinting(tx, print.id, print);
    }
  });
}
