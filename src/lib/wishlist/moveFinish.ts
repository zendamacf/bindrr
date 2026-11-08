import { CARD_FINISHES, type CardFinish } from '@/lib/collection/finish';
import type { WishlistCard } from './types';

type FinishAvailability = Pick<WishlistCard, 'canAddNonfoil' | 'canAddFoil' | 'canAddEtched'>;
type MoveFinishInput = FinishAvailability & Pick<WishlistCard, 'finish'>;

/** Returns the finishes that the printing has, in the usual order. */
export function availableMoveFinishes(card: FinishAvailability): CardFinish[] {
  return CARD_FINISHES.filter((finish) => {
    if (finish === 'foil') return card.canAddFoil;
    if (finish === 'etched') return card.canAddEtched;
    return card.canAddNonfoil;
  });
}

/**
 * Returns the finish that the move dialog selects at first.
 * An item with a specific finish selects that finish, if the printing has it.
 * If the printing has only one finish, the dialog selects it.
 * Otherwise this function returns null and the user must choose.
 */
export function defaultMoveFinish(card: MoveFinishInput): CardFinish | null {
  const available = availableMoveFinishes(card);
  if (card.finish !== 'any' && available.includes(card.finish)) return card.finish;
  return available.length === 1 ? available[0] : null;
}
