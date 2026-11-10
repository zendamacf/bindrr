import type { SortDirection } from '@/lib/collection/types';
import type { WishlistFinish } from './finish';

export type WishlistSort =
  | 'name'
  | 'setname'
  | 'rarity'
  | 'quantity'
  | 'finish'
  | 'price'
  | 'added';

export const WISHLIST_SORT_KEYS: WishlistSort[] = [
  'name',
  'setname',
  'rarity',
  'quantity',
  'finish',
  'price',
  'added',
];

export type GetWishlistParams = {
  userId: number;
  currencyCode?: string;
  page?: number;
  /** Rows per page; defaults to `WISHLIST_PAGE_SIZE`. */
  pageSize?: number;
  sort?: WishlistSort;
  sortDesc?: SortDirection;
  filterSearch?: string;
  filterSet?: number;
  filterRarity?: string;
  filterFinish?: WishlistFinish;
};

export type WishlistCard = {
  wishlistPrintingId: number;
  printingId: number;
  scryfallId: string | null;
  name: string;
  setName: string;
  setCode: string;
  collectorNumber: string;
  rarity: string | null;
  /** The number of copies that the user wants. */
  quantity: number;
  finish: WishlistFinish;
  /** The unit price in the selected currency. */
  price: number | null;
  /** True when the price is the lowest price of all finishes (finish `any`). */
  priceIsMinimum: boolean;
  currencyCode: string;
  /** Scryfall language code (for example `en` or `ja`). */
  languageCode: string;
  language: string;
  imageUrl: string | null;
  /** The finishes that the printing has. Use these to limit the finish choices. */
  canAddNonfoil: boolean;
  canAddFoil: boolean;
  canAddEtched: boolean;
  /** ISO date and time when the user added the item. */
  addedAt: string;
};

export type GetWishlistResult = {
  cards: WishlistCard[];
  /** The total number of pages. */
  count: number;
  /** The total number of wanted copies. */
  total: number;
  /** The total cost of all wanted copies in the selected currency. */
  totalPrice: number;
  currencyCode: string;
};
