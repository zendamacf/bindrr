import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { wishlist_printings } from '@/lib/db/schema';
import type { WishlistFinish } from './finish';

export type UpdateWishlistItemResult = {
  ok: true;
  removed: boolean;
  wishlistPrintingId?: number;
};

/**
 * Changes the quantity or the finish of a wishlist item.
 * A quantity of 0 removes the item.
 * If a different item has the new finish, this function merges the two items.
 * Returns null when the item does not exist or the user does not own it.
 */
export async function updateWishlistItem(params: {
  userId: number;
  wishlistPrintingId: number;
  quantity?: number;
  finish?: WishlistFinish;
}): Promise<UpdateWishlistItemResult | null> {
  if (params.quantity === undefined && params.finish === undefined) {
    throw new Error('Nothing to update');
  }
  if (params.quantity !== undefined && (!Number.isFinite(params.quantity) || params.quantity < 0)) {
    throw new Error('Invalid quantity');
  }

  const quantityInput = params.quantity === undefined ? undefined : Math.floor(params.quantity);

  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        id: wishlist_printings.id,
        printingId: wishlist_printings.printing_id,
        quantity: wishlist_printings.quantity,
        finish: wishlist_printings.finish,
      })
      .from(wishlist_printings)
      .where(
        and(
          eq(wishlist_printings.id, params.wishlistPrintingId),
          eq(wishlist_printings.user_id, params.userId),
        ),
      )
      .limit(1);

    if (!row) return null;

    const quantity = quantityInput ?? row.quantity;
    const finish = params.finish ?? row.finish;

    if (quantity === 0) {
      await tx.delete(wishlist_printings).where(eq(wishlist_printings.id, row.id));
      return { ok: true, removed: true };
    }

    if (finish !== row.finish) {
      const [target] = await tx
        .select({ id: wishlist_printings.id, quantity: wishlist_printings.quantity })
        .from(wishlist_printings)
        .where(
          and(
            eq(wishlist_printings.user_id, params.userId),
            eq(wishlist_printings.printing_id, row.printingId),
            eq(wishlist_printings.finish, finish),
          ),
        )
        .limit(1);

      if (target) {
        await tx.delete(wishlist_printings).where(eq(wishlist_printings.id, row.id));
        await tx
          .update(wishlist_printings)
          .set({ quantity: target.quantity + quantity })
          .where(eq(wishlist_printings.id, target.id));
        return { ok: true, removed: false, wishlistPrintingId: target.id };
      }
    }

    await tx
      .update(wishlist_printings)
      .set({ quantity, finish })
      .where(eq(wishlist_printings.id, row.id));

    return { ok: true, removed: false, wishlistPrintingId: row.id };
  });
}
