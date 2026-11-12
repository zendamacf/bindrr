import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { wishlist_cards } from '@/lib/db/schema';
import type { WishlistFinish } from './finish';

export type UpdateWishlistAnyResult = {
  ok: true;
  removed: boolean;
  wishlistCardId?: number;
};

/**
 * Changes the quantity or finish of a wishlist entry for any printing.
 * A quantity of 0 removes the entry.
 * If a different entry has the new finish, this function merges the two entries.
 * Returns null when the entry does not exist or the user does not own it.
 */
export async function updateWishlistAny(params: {
  userId: number;
  wishlistCardId: number;
  quantity?: number;
  finish?: WishlistFinish;
}): Promise<UpdateWishlistAnyResult | null> {
  if (params.quantity === undefined && params.finish === undefined) {
    throw new Error('Nothing to update');
  }
  if (params.quantity !== undefined && (!Number.isFinite(params.quantity) || params.quantity < 0)) {
    throw new Error('Invalid quantity');
  }

  const quantityInput = params.quantity === undefined ? undefined : Math.floor(params.quantity);

  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(wishlist_cards)
      .where(
        and(
          eq(wishlist_cards.id, params.wishlistCardId),
          eq(wishlist_cards.user_id, params.userId),
        ),
      )
      .limit(1)
      .for('update');

    if (!row) return null;

    const quantity = quantityInput ?? row.quantity;
    const finish = params.finish ?? row.finish;

    if (quantity === 0) {
      await tx.delete(wishlist_cards).where(eq(wishlist_cards.id, row.id));
      return { ok: true, removed: true };
    }

    if (finish !== row.finish) {
      const [target] = await tx
        .select({ id: wishlist_cards.id, quantity: wishlist_cards.quantity })
        .from(wishlist_cards)
        .where(
          and(
            eq(wishlist_cards.user_id, params.userId),
            eq(wishlist_cards.card_id, row.card_id),
            eq(wishlist_cards.finish, finish),
          ),
        )
        .limit(1);

      if (target) {
        await tx.delete(wishlist_cards).where(eq(wishlist_cards.id, row.id));
        await tx
          .update(wishlist_cards)
          .set({ quantity: target.quantity + quantity })
          .where(eq(wishlist_cards.id, target.id));
        return { ok: true, removed: false, wishlistCardId: target.id };
      }
    }

    await tx.update(wishlist_cards).set({ quantity, finish }).where(eq(wishlist_cards.id, row.id));

    return { ok: true, removed: false, wishlistCardId: row.id };
  });
}
