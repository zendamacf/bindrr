export type CollectionSort = 'name' | 'setname' | 'rarity' | 'quantity' | 'foil' | 'price';

export type SortDirection = 'asc' | 'desc';

export type GetCollectionParams = {
  userId: number;
  currencyCode?: string;
  page?: number;
  sort?: CollectionSort;
  sortDesc?: SortDirection;
  filterSearch?: string;
  filterSet?: number;
  filterRarity?: string;
};

export type CollectionCard = {
  collectionPrintingId: number;
  printingId: number;
  name: string;
  setName: string;
  setCode: string;
  rarity: string | null;
  quantity: number;
  foil: boolean;
  etched: boolean;
  price: number | null;
  basePrice: number | null;
  currencyCode: string;
  /** Scryfall language code (e.g. `en`, `ja`). */
  languageCode: string;
  language: string;
  imageUrl: string | null;
};

export type CollectionLogEntry = {
  id: number;
  change: number;
  occurred: string;
};

export type CollectionItemDetail = CollectionCard & {
  collectorNumber: string;
  setSymbolUrl: string | null;
  scryfallId: string | null;
  tcgplayerProductId: string | null;
  canAddNonfoil: boolean;
  canAddFoil: boolean;
  canAddEtched: boolean;
  history: CollectionLogEntry[];
};

export type { ScryfallCardExtendedDetails } from '@/lib/scryfall/extendedDetails';

export type GetCollectionResult = {
  cards: CollectionCard[];
  count: number;
  total: number;
  totalPrice: number;
  currencyCode: string;
};

export type CardSearchResult = {
  scryfallId: string;
  name: string;
  setName: string;
  setCode: string;
  collectorNumber: string;
  languageCode: string;
  imageUrl: string | null;
  price: number | null;
  priceFoil: number | null;
  priceEtched: number | null;
  currencyCode: string;
  tcgplayerProductId: string | null;
  canAddNonfoil: boolean;
  canAddFoil: boolean;
  canAddEtched: boolean;
};
