import { and, eq, ne, sql } from 'drizzle-orm';
import { ensurePrinting } from '@/lib/collection/ensurePrinting';
import { db } from '@/lib/db';
import { wishlist_printings } from '@/lib/db/schema';
import type { WishlistFinish } from './finish';

/**
 * Adds a printing to the wishlist of the user.
 * If the same printing and finish is on the wishlist, this function increases the quantity.
 * The result field `overlapsOtherFinish` is true when the printing is also on the wishlist
 * with a finish that can match the same card. This happens when one item has the finish `any`
 * and the other item has a specific finish.
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

    const others = await tx
      .select({ finish: wishlist_printings.finish })
      .from(wishlist_printings)
      .where(
        and(
          eq(wishlist_printings.user_id, params.userId),
          eq(wishlist_printings.printing_id, printingId),
          ne(wishlist_printings.id, row.id),
        ),
      );
    const overlapsOtherFinish = others.some(
      (other) => params.finish === 'any' || other.finish === 'any',
    );

    return {
      ok: true,
      wishlistPrintingId: row.id,
      printingId,
      quantity: row.quantity,
      overlapsOtherFinish,
    };
  });
}
