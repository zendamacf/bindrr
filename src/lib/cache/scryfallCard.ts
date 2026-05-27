import 'server-only';

import { type ScryfallCard, scryfallGetCardById } from '@/lib/scryfall/client';

/** Max Scryfall cards retained in the in-process LRU (per serverless instance). */
export const MAX_CACHED_SCRYFALL_CARDS = 128;

const CARD_CACHE_TTL_MS = 604_800_000;

type CacheEntry = {
  card: ScryfallCard;
  expiresAt: number;
};

/**
 * Bounded LRU cache for Scryfall card JSON. Does not use `unstable_cache` so entry
 * count cannot grow without limit across unique card ids.
 */
class ScryfallCardLruCache {
  private readonly entries = new Map<string, CacheEntry>();

  constructor(private readonly maxSize: number) {}

  get(id: string): ScryfallCard | null {
    const entry = this.entries.get(id);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.entries.delete(id);
      return null;
    }

    this.entries.delete(id);
    this.entries.set(id, entry);
    return entry.card;
  }

  set(id: string, card: ScryfallCard): void {
    if (this.entries.has(id)) {
      this.entries.delete(id);
    }

    while (this.entries.size >= this.maxSize) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey === undefined) break;
      this.entries.delete(oldestKey);
    }

    this.entries.set(id, {
      card,
      expiresAt: Date.now() + CARD_CACHE_TTL_MS,
    });
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}

const cardCache = new ScryfallCardLruCache(MAX_CACHED_SCRYFALL_CARDS);

export async function getScryfallCardByIdCached(scryfallId: string): Promise<ScryfallCard> {
  const cached = cardCache.get(scryfallId);
  if (cached) return cached;

  const card = await scryfallGetCardById(scryfallId);
  cardCache.set(scryfallId, card);
  return card;
}

/** @internal Test helper */
export function clearScryfallCardCache(): void {
  cardCache.clear();
}

/** @internal Test helper */
export function scryfallCardCacheSize(): number {
  return cardCache.size;
}
