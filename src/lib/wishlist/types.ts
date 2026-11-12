import type { CardFinish } from '@/lib/collection/finish';
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

/** The cheapest printing that matches an entry for any printing. */
export type WishlistAnyCheapest = {
  scryfallId: string | null;
  setName: string;
  setCode: string;
  collectorNumber: string;
  languageCode: string;
  /** The finish that has the lowest price. */
  finish: CardFinish;
  /** The unit price in the selected currency. */
  price: number | null;
  imageUrl: string | null;
};

/** A wishlist entry for a card in any printing. */
export type WishlistAnyCard = {
  wishlistCardId: number;
  cardId: number;
  name: string;
  /** The number of copies that the user wants. */
  quantity: number;
  /** The copies in the collection that match the finish of the entry, in any language. */
  owned: number;
  /** The copies that are still missing: the wanted copies minus the owned copies, at least 0. */
  missing: number;
  finish: WishlistFinish;
  /** Null when no matching printing has a price. */
  cheapest: WishlistAnyCheapest | null;
  currencyCode: string;
  addedAt: string;
};

export type GetWishlistAnyResult = {
  cards: WishlistAnyCard[];
  /** The cost of the missing copies at the cheapest prices, in the selected currency. */
  totalPrice: number;
  currencyCode: string;
};

/** A printing that the user can pick when they add an any-printing entry to the collection. */
export type WishlistAnyPrintingOption = {
  scryfallId: string;
  setName: string;
  setCode: string;
  collectorNumber: string;
  languageCode: string;
  imageUrl: string | null;
  /** The finishes that match the entry and that the printing has. Prices are in the selected currency. */
  finishes: { finish: CardFinish; price: number | null }[];
};

export type GetWishlistAnyPrintingsResult = {
  name: string;
  /** Matching printings, cheapest first. */
  printings: WishlistAnyPrintingOption[];
  currencyCode: string;
};
