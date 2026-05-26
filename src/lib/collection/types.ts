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
