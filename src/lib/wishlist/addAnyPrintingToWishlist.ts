import { eq, sql } from 'drizzle-orm';
import { ensurePrinting } from '@/lib/collection/ensurePrinting';
import { db } from '@/lib/db';
import { cards, printings, wishlist_cards } from '@/lib/db/schema';
import type { WishlistFinish } from './finish';
import { fetchCardPrints, storeCardPrints } from './loadCardPrintings';

/**
 * Adds a card to the wishlist for any printing.
 * The card comes from the printing with the given Scryfall ID.
 * This function loads the other printings of the card from Scryfall, so that the cheapest
 * printing is known and the price sync covers them. Scryfall errors for this step do not
 * stop the add; the entry then uses the printings that are already known.
 * If the same card and finish is on the wishlist, this function increases the quantity.
 */
export async function addAnyPrintingToWishlist(params: {
  userId: number;
  scryfallId: string;
  quantity: number;
  finish: WishlistFinish;
}) {
  const quantity = Math.max(1, Math.floor(params.quantity));

  const card = await db.transaction(async (tx) => {
    const printingId = await ensurePrinting(tx, params.scryfallId);
    const [found] = await tx
      .select({ id: cards.id, name: cards.name })
      .from(printings)
      .innerJoin(cards, eq(printings.card_id, cards.id))
      .where(eq(printings.id, printingId))
      .limit(1);
    return found;
  });

  // The Scryfall request runs outside of a transaction, so that it does not hold a connection.
  await storeCardPrints(await fetchCardPrints(card.name));

  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(wishlist_cards)
      .values({
        user_id: params.userId,
        card_id: card.id,
        finish: params.finish,
        quantity,
      })
      .onConflictDoUpdate({
        target: [wishlist_cards.user_id, wishlist_cards.card_id, wishlist_cards.finish],
        set: { quantity: sql`${wishlist_cards.quantity} + ${quantity}` },
      })
      .returning({ id: wishlist_cards.id, quantity: wishlist_cards.quantity });

    return { ok: true, wishlistCardId: row.id, cardId: card.id, quantity: row.quantity };
  });
}
