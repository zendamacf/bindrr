export type CollectionSort = 'name' | 'setname' | 'rarity' | 'quantity' | 'foil' | 'price';

export type SortDirection = 'asc' | 'desc';

export type GetCollectionParams = {
  userId: number;
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
  language: string | null;
  imageUrl: string | null;
};

export type GetCollectionResult = {
  cards: CollectionCard[];
  count: number;
  total: number;
  totalPrice: number;
};

export type CardSearchResult = {
  scryfallId: string;
  name: string;
  setName: string;
  setCode: string;
  collectorNumber: string;
  language: string | null;
  imageUrl: string | null;
  priceUsd: string | null;
  priceUsdFoil: string | null;
  priceUsdEtched: string | null;
  tcgplayerProductId: string | null;
  canAddNonfoil: boolean;
  canAddFoil: boolean;
  canAddEtched: boolean;
};
