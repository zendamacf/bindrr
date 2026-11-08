import type { WishlistCard } from '@/lib/wishlist/types';
import { formatMoney } from '@/utils/formatMoney';

/** Returns the price text for a wishlist item. The finish "any" shows the lowest price. */
export function wishlistPriceLabel(card: WishlistCard): string {
  const label = formatMoney(card.price, card.currencyCode);
  if (label == null) return '—';
  return card.priceIsMinimum ? `from ${label}` : label;
}
