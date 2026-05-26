import { scryfallPrintingImageUrl } from '@/lib/scryfall/client';

export const COLLECTION_PAGE_SIZE = 20;

const RARITY_LABELS: Record<string, string> = {
  C: 'Common',
  U: 'Uncommon',
  R: 'Rare',
  M: 'Mythic',
  S: 'Special',
};

export function pageCount(total: number, limit: number): number {
  if (total <= 0) return 0;
  return Math.ceil(total / limit);
}

export function rarityLabel(rarity: string | null): string | null {
  if (!rarity) return null;
  return RARITY_LABELS[rarity] ?? rarity;
}

export function unitPrice(
  foil: boolean,
  price: string | null,
  foilprice: string | null,
): number | null {
  const raw = foil ? foilprice : price;
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function printingImageUrl(scryfallId: string | null): string | null {
  return scryfallPrintingImageUrl(scryfallId);
}

export function formatLanguage(language: string | null): string | null {
  if (!language || language === 'en') return null;
  return language.toUpperCase();
}
