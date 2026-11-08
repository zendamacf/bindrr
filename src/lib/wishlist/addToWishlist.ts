import { sql } from 'drizzle-orm';
import { ensurePrinting } from '@/lib/collection/ensurePrinting';
import { db } from '@/lib/db';
import { wishlist_printings } from '@/lib/db/schema';
import type { WishlistFinish } from './finish';

/**
 * Adds a printing to the wishlist of the user.
 * If the same printing and finish is on the wishlist, this function increases the quantity.
 */
export async function addToWishlist(params: {
  userId: number;
  scryfallId: string;
  quantity: number;
  finish: WishlistFinish;
}) {
  const quantity = Math.max(1, Math.floor(params.quantity));

  return db.transaction(async (tx) => {
    const printingId = await ensurePrinting(tx, params.scryfallId);

    const [row] = await tx
      .insert(wishlist_printings)
      .values({
        user_id: params.userId,
        printing_id: printingId,
        finish: params.finish,
        quantity,
      })
      .onConflictDoUpdate({
        target: [
          wishlist_printings.user_id,
          wishlist_printings.printing_id,
          wishlist_printings.finish,
        ],
        set: { quantity: sql`${wishlist_printings.quantity} + ${quantity}` },
      })
      .returning({ id: wishlist_printings.id, quantity: wishlist_printings.quantity });

    return { ok: true, wishlistPrintingId: row.id, printingId, quantity: row.quantity };
  });
}
