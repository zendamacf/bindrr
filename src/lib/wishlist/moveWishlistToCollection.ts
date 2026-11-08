import { and, eq } from 'drizzle-orm';
import { addPrintingToCollection } from '@/lib/collection/addPrintingToCollection';
import type { CardFinish } from '@/lib/collection/finish';
import { db } from '@/lib/db';
import { wishlist_printings } from '@/lib/db/schema';

/** The user asked to move more copies than the wishlist item has, or fewer than 1. */
export class InvalidMoveQuantityError extends Error {
  constructor() {
    super('Invalid quantity');
    this.name = 'InvalidMoveQuantityError';
  }
}

export type MoveWishlistToCollectionResult = {
  ok: true;
  collectionPrintingId: number;
  printingId: number;
  /** The number of copies that moved to the collection. */
  moved: number;
  /** The number of copies that are still on the wishlist. 0 means the item is removed. */
  remaining: number;
};

/**
 * Moves copies of a wishlist item to the collection of the user.
 * One transaction adds the copies to the collection, and lowers the wishlist quantity.
 * If all copies move, this function removes the wishlist item.
 * If the quantity is not set, all wanted copies move.
 * Returns null when the item does not exist or the user does not own it.
 */
export async function moveWishlistToCollection(params: {
  userId: number;
  wishlistPrintingId: number;
  finish: CardFinish;
  quantity?: number;
}): Promise<MoveWishlistToCollectionResult | null> {
  if (
    params.quantity !== undefined &&
    (!Number.isFinite(params.quantity) || Math.floor(params.quantity) < 1)
  ) {
    throw new InvalidMoveQuantityError();
  }

  return db.transaction(async (tx) => {
    // The row lock stops two moves of the same item from using the same copies.
    const [row] = await tx
      .select({
        id: wishlist_printings.id,
        printingId: wishlist_printings.printing_id,
        quantity: wishlist_printings.quantity,
      })
      .from(wishlist_printings)
      .where(
        and(
          eq(wishlist_printings.id, params.wishlistPrintingId),
          eq(wishlist_printings.user_id, params.userId),
        ),
      )
      .limit(1)
      .for('update');

    if (!row) return null;

    const moved = params.quantity === undefined ? row.quantity : Math.floor(params.quantity);
    if (moved > row.quantity) throw new InvalidMoveQuantityError();

    const { collectionPrintingId } = await addPrintingToCollection(tx, {
      userId: params.userId,
      printingId: row.printingId,
      quantity: moved,
      finish: params.finish,
    });

    const remaining = row.quantity - moved;
    if (remaining === 0) {
      await tx.delete(wishlist_printings).where(eq(wishlist_printings.id, row.id));
    } else {
      await tx
        .update(wishlist_printings)
        .set({ quantity: remaining })
        .where(eq(wishlist_printings.id, row.id));
    }

    return { ok: true, collectionPrintingId, printingId: row.printingId, moved, remaining };
  });
}
